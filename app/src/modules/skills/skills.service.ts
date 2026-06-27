import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { skills, profileSkills } from '../../drizzle/schema';
import { SearchSkillsDto } from './dto/search-skills.dto';
import { DeclareSkillDto } from './dto/declare-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Référentiel administré (cf. docs/merise/00-cadrage.md) : lecture
   * publique, pas de création par l'API membre.
   */
  async search(filters: SearchSkillsDto) {
    const conditions = [eq(skills.isActive, true)];
    if (filters.search) {
      conditions.push(ilike(skills.name, `%${filters.search}%`));
    }
    if (filters.category) {
      conditions.push(eq(skills.category, filters.category));
    }

    const rows = await this.dbService.db
      .select()
      .from(skills)
      .where(and(...conditions))
      .orderBy(skills.name)
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0);

    return { items: rows, limit: filters.limit ?? 50, offset: filters.offset ?? 0 };
  }

  /**
   * RG-02/RG-03 : un profil déclare plusieurs compétences, le couple
   * profil-compétence est unique -> upsert sur (profile_id, skill_id).
   */
  async declare(profileId: string, skillId: string, dto: DeclareSkillDto) {
    const [skill] = await this.dbService.db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.id, skillId), eq(skills.isActive, true)))
      .limit(1);

    if (!skill) {
      throw new NotFoundException('Compétence introuvable dans le référentiel.');
    }

    const [row] = await this.dbService.db
      .insert(profileSkills)
      .values({
        profileId,
        skillId,
        level: dto.level,
        yearsExperience: dto.yearsExperience?.toString(),
        isPrimary: dto.isPrimary ?? false,
      })
      .onConflictDoUpdate({
        target: [profileSkills.profileId, profileSkills.skillId],
        set: {
          level: dto.level,
          yearsExperience: dto.yearsExperience?.toString(),
          isPrimary: dto.isPrimary ?? false,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    return row;
  }

  async remove(profileId: string, skillId: string) {
    const deleted = await this.dbService.db
      .delete(profileSkills)
      .where(and(eq(profileSkills.profileId, profileId), eq(profileSkills.skillId, skillId)))
      .returning({ skillId: profileSkills.skillId });

    if (deleted.length === 0) {
      throw new NotFoundException("Cette compétence n'est pas déclarée sur ce profil.");
    }
    return { removed: true };
  }

  /** Utilisé par ProfilesController pour enrichir un profil public. */
  async listForProfile(profileId: string) {
    return this.dbService.db
      .select({
        skillId: skills.id,
        name: skills.name,
        slug: skills.slug,
        category: skills.category,
        level: profileSkills.level,
        yearsExperience: profileSkills.yearsExperience,
        isPrimary: profileSkills.isPrimary,
      })
      .from(profileSkills)
      .innerJoin(skills, eq(skills.id, profileSkills.skillId))
      .where(eq(profileSkills.profileId, profileId))
      .orderBy(profileSkills.isPrimary, skills.name);
  }
}
