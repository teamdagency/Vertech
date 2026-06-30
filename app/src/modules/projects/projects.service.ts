import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { projects, projectMembers, projectSkills, projectMedia, skills, profiles } from '../../drizzle/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { mapPgError } from '../../common/pg-error.util';

const CONSTRAINT_MESSAGES = {
  projects_slug_key: 'Ce slug de projet est déjà utilisé.',
  projects_dates_ordered: 'La date de fin doit être postérieure à la date de début.',
  project_members_pkey: 'Ce profil est déjà contributeur du projet.',
};

@Injectable()
export class ProjectsService {
  constructor(private readonly dbService: DbService) {}

  /**
   * RG-04 : un projet a un propriétaire (-> contributeur via le trigger
   * SQL `projects_add_owner`, pas dupliqué côté app).
   * RG-06 : couple projet-compétence unique -> déduplication des skillIds.
   */
  async create(ownerId: string, dto: CreateProjectDto) {
    try {
      return await this.dbService.db.transaction(async (tx) => {
        const [project] = await tx
          .insert(projects)
          .values({
            ownerId,
            title: dto.title,
            slug: dto.slug,
            summary: dto.summary,
            description: dto.description,
            status: dto.status,
            visibility: dto.visibility,
            sourceUrl: dto.sourceUrl,
            demoUrl: dto.demoUrl,
            helpNeeded: dto.helpNeeded,
            startedAt: dto.startedAt,
            completedAt: dto.completedAt,
          })
          .returning();

        const uniqueSkillIds = [...new Set(dto.skillIds ?? [])];
        if (uniqueSkillIds.length > 0) {
          await tx
            .insert(projectSkills)
            .values(uniqueSkillIds.map((skillId) => ({ projectId: project.id, skillId })));
        }

        const { searchVector, ...publicFields } = project;
        return publicFields;
      });
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  /**
   * Respecte project.visibility (public/members/private), 404 uniforme
   * en cas de refus pour ne pas révéler l'existence du projet.
   */
  async getBySlug(slug: string, requesterProfileId?: string) {
    const [project] = await this.dbService.db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), isNull(projects.deletedAt)))
      .limit(1);

    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }

    const isOwner = requesterProfileId === project.ownerId;
    const canView =
      project.visibility === 'public' ||
      (project.visibility === 'members' && Boolean(requesterProfileId)) ||
      isOwner;

    if (!canView) {
      throw new NotFoundException('Projet introuvable.');
    }

    const [members, projectSkillRows, media] = await Promise.all([
      this.dbService.db
        .select({
          profileId: projectMembers.profileId,
          username: profiles.username,
          displayName: profiles.displayName,
          role: projectMembers.role,
          contribution: projectMembers.contribution,
          isOwner: projectMembers.isOwner,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(profiles, eq(profiles.id, projectMembers.profileId))
        .where(and(eq(projectMembers.projectId, project.id), isNull(projectMembers.leftAt))),
      this.dbService.db
        .select({ skillId: skills.id, name: skills.name, slug: skills.slug })
        .from(projectSkills)
        .innerJoin(skills, eq(skills.id, projectSkills.skillId))
        .where(eq(projectSkills.projectId, project.id)),
      this.dbService.db
        .select()
        .from(projectMedia)
        .where(eq(projectMedia.projectId, project.id))
        .orderBy(projectMedia.position),
    ]);

    const { searchVector, ...publicFields } = project;
    return { ...publicFields, members, skills: projectSkillRows, media };
  }

  /** MVP : seul le propriétaire peut modifier le projet. */
  async update(projectId: string, requesterProfileId: string, dto: UpdateProjectDto) {
    await this.assertOwner(projectId, requesterProfileId);

    if (Object.keys(dto).length === 0) {
      throw new ForbiddenException('Aucun champ à mettre à jour.');
    }

    try {
      const [updated] = await this.dbService.db
        .update(projects)
        .set(dto)
        .where(eq(projects.id, projectId))
        .returning();

      const { searchVector, ...publicFields } = updated;
      return publicFields;
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  /** MVP : seul le propriétaire ajoute des contributeurs. */
  async addMember(projectId: string, requesterProfileId: string, dto: AddMemberDto) {
    await this.assertOwner(projectId, requesterProfileId);

    try {
      const [member] = await this.dbService.db
        .insert(projectMembers)
        .values({
          projectId,
          profileId: dto.profileId,
          role: dto.role,
          contribution: dto.contribution,
        })
        .returning();
      return member;
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  private async assertOwner(projectId: string, requesterProfileId: string) {
    const [project] = await this.dbService.db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1);

    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    if (project.ownerId !== requesterProfileId) {
      throw new ForbiddenException('Seul le propriétaire du projet peut effectuer cette action.');
    }
  }
}
