import { Injectable } from '@nestjs/common';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { profiles, projects } from '../../drizzle/schema';
import { SearchDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly dbService: DbService) {}

  /**
   * GET /search — plein texte PostgreSQL (search_vector + GIN, cf.
   * database/schema.sql) sur profils et projets publics. Ce module
   * indexe, il n'est pas la source de vérité (-> PostgreSQL le reste).
   */
  async search(dto: SearchDto) {
    const wantProfiles = dto.type !== 'projects';
    const wantProjects = dto.type !== 'profiles';
    const limit = dto.limit ?? 10;

    const [profileResults, projectResults] = await Promise.all([
      wantProfiles ? this.searchProfiles(dto.q, limit) : Promise.resolve([]),
      wantProjects ? this.searchProjects(dto.q, limit) : Promise.resolve([]),
    ]);

    return { query: dto.q, profiles: profileResults, projects: projectResults };
  }

  private async searchProfiles(q: string, limit: number) {
    const query = sql`websearch_to_tsquery('simple', ${q})`;
    return this.dbService.db
      .select({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        headline: profiles.headline,
        city: profiles.city,
        countryCode: profiles.countryCode,
        avatarUrl: profiles.avatarUrl,
        rank: sql<number>`ts_rank(${profiles.searchVector}, ${query})`,
      })
      .from(profiles)
      .where(
        and(
          isNull(profiles.deletedAt),
          eq(profiles.visibility, 'public'),
          sql`${profiles.searchVector} @@ ${query}`,
        ),
      )
      .orderBy(sql`ts_rank(${profiles.searchVector}, ${query}) desc`)
      .limit(limit);
  }

  private async searchProjects(q: string, limit: number) {
    const query = sql`websearch_to_tsquery('simple', ${q})`;
    return this.dbService.db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        summary: projects.summary,
        status: projects.status,
        rank: sql<number>`ts_rank(${projects.searchVector}, ${query})`,
      })
      .from(projects)
      .where(
        and(
          isNull(projects.deletedAt),
          eq(projects.visibility, 'public'),
          // RG-14 : une ressource archivée ne doit pas apparaître en recherche publique.
          ne(projects.status, 'archived'),
          sql`${projects.searchVector} @@ ${query}`,
        ),
      )
      .orderBy(sql`ts_rank(${projects.searchVector}, ${query}) desc`)
      .limit(limit);
  }
}
