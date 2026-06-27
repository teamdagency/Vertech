import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { profiles, profileSkills, skills } from '../../drizzle/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Respecte profile.visibility : public (tout le monde), members
   * (membres authentifiés), private (uniquement le propriétaire).
   * 404 dans tous les cas de refus pour ne pas révéler l'existence
   * d'un profil privé.
   */
  async getByUsername(username: string, requesterProfileId?: string) {
    const [profile] = await this.dbService.db
      .select()
      .from(profiles)
      .where(and(eq(profiles.username, username), isNull(profiles.deletedAt)))
      .limit(1);

    if (!profile) {
      throw new NotFoundException('Profil introuvable.');
    }

    const isOwner = requesterProfileId === profile.id;
    const canView =
      profile.visibility === 'public' ||
      (profile.visibility === 'members' && Boolean(requesterProfileId)) ||
      isOwner;

    if (!canView) {
      throw new NotFoundException('Profil introuvable.');
    }

    const { searchVector, ...publicFields } = profile;
    return publicFields;
  }

  async updateMe(profileId: string, dto: UpdateProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new ForbiddenException('Aucun champ à mettre à jour.');
    }

    const [updated] = await this.dbService.db
      .update(profiles)
      .set(dto)
      .where(eq(profiles.id, profileId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Profil introuvable.');
    }

    const { searchVector, ...publicFields } = updated;
    return publicFields;
  }

  /**
   * Annuaire de talents : ne porte que sur les profils publics actifs
   * (même condition que l'index partiel profiles_discovery_idx).
   */
  async search(filters: SearchProfilesDto) {
    const conditions = [isNull(profiles.deletedAt), eq(profiles.visibility, 'public')];

    if (filters.country) {
      conditions.push(eq(profiles.countryCode, filters.country.toUpperCase()));
    }
    if (filters.city) {
      conditions.push(eq(profiles.city, filters.city));
    }
    if (filters.availability) {
      conditions.push(eq(profiles.availability, filters.availability));
    }

    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    if (filters.skill) {
      const skillConditions = [eq(skills.slug, filters.skill)];
      if (filters.level) {
        skillConditions.push(sql`${profileSkills.level} >= ${filters.level}`);
      }

      const rows = await this.dbService.db
        .select({
          id: profiles.id,
          username: profiles.username,
          displayName: profiles.displayName,
          headline: profiles.headline,
          countryCode: profiles.countryCode,
          city: profiles.city,
          availability: profiles.availability,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .innerJoin(profileSkills, eq(profileSkills.profileId, profiles.id))
        .innerJoin(skills, eq(skills.id, profileSkills.skillId))
        .where(and(...conditions, ...skillConditions))
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset);

      return { items: rows, limit, offset };
    }

    const rows = await this.dbService.db
      .select({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        headline: profiles.headline,
        countryCode: profiles.countryCode,
        city: profiles.city,
        availability: profiles.availability,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(and(...conditions))
      .orderBy(desc(profiles.createdAt))
      .limit(limit)
      .offset(offset);

    return { items: rows, limit, offset };
  }
}
