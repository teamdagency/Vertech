import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DbService } from '../../drizzle/db.service';
import * as schema from '../../drizzle/schema';
import {
  endorsements,
  recommendations,
  reputationEvents,
  reputationScores,
  profileSkills,
  profiles,
  users,
  reputationDimension,
} from '../../drizzle/schema';
import { EndorseSkillDto } from './dto/endorse-skill.dto';
import { RecommendDto } from './dto/recommend.dto';
import { mapPgError } from '../../common/pg-error.util';
import { NotificationsService } from '../notifications/notifications.service';

type ReputationDimension = (typeof reputationDimension.enumValues)[number];
type DrizzleDb = NodePgDatabase<typeof schema>;

const CONSTRAINT_MESSAGES = {
  endorsements_endorser_id_recipient_id_skill_id_key: 'Vous avez déjà validé cette compétence pour ce profil.',
  endorsements_distinct_profiles: 'Vous ne pouvez pas valider votre propre compétence.',
  recommendations_author_id_recipient_id_key: 'Vous avez déjà recommandé ce membre.',
  recommendations_distinct_profiles: 'Vous ne pouvez pas vous recommander vous-même.',
};

// Garde-fous ADR-003 — pondérations initiales, à réviser après volume réel.
const NEW_ACCOUNT_DAYS = 7;
const NEW_ACCOUNT_MULTIPLIER = 0.5;
/** Plafonne la contribution d'une même source à une dimension (anti-domination). */
const MAX_POINTS_PER_SOURCE = 15;

@Injectable()
export class TrustService {
  constructor(
    private readonly dbService: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * RG-09 (couple validateur/profil/compétence unique, en DB) + garde-fous
   * ADR-003 (anti-auto-validation, poids réduit comptes neufs).
   */
  async endorseSkill(recipientId: string, endorserId: string, dto: EndorseSkillDto) {
    if (endorserId === recipientId) {
      throw new ForbiddenException('Vous ne pouvez pas valider votre propre compétence.');
    }

    const [declared] = await this.dbService.db
      .select({ skillId: profileSkills.skillId })
      .from(profileSkills)
      .where(and(eq(profileSkills.profileId, recipientId), eq(profileSkills.skillId, dto.skillId)))
      .limit(1);
    if (!declared) {
      throw new BadRequestException("Ce profil n'a pas déclaré cette compétence.");
    }

    const multiplier = await this.sourceWeightMultiplier(endorserId);
    const points = (dto.strength ?? 1) * 3 * multiplier;

    try {
      const endorsement = await this.dbService.db.transaction(async (tx) => {
        const [endorsement] = await tx
          .insert(endorsements)
          .values({
            endorserId,
            recipientId,
            skillId: dto.skillId,
            projectId: dto.projectId,
            strength: dto.strength ?? 1,
            comment: dto.comment,
          })
          .returning();

        await tx.insert(reputationEvents).values({
          profileId: recipientId,
          eventType: 'skill_endorsed',
          dimension: 'technical',
          points: points.toFixed(2),
          evidenceType: 'endorsement',
          evidenceId: endorsement.id,
          sourceProfileId: endorserId,
          metadata: { skillId: dto.skillId, strength: dto.strength ?? 1 },
        });

        await this.recalculate(tx, recipientId, 'technical');
        return endorsement;
      });

      await this.notificationsService.create({
        recipientId,
        actorId: endorserId,
        type: 'skill_endorsed',
        entityType: 'endorsement',
        entityId: endorsement.id,
        payload: { skillId: dto.skillId, strength: dto.strength ?? 1 },
      });

      return endorsement;
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  /** RG-10 (couple auteur/bénéficiaire unique, en DB). */
  async recommend(recipientId: string, authorId: string, dto: RecommendDto) {
    if (authorId === recipientId) {
      throw new ForbiddenException('Vous ne pouvez pas vous recommander vous-même.');
    }

    const multiplier = await this.sourceWeightMultiplier(authorId);
    const points = 5 * multiplier;

    try {
      const recommendation = await this.dbService.db.transaction(async (tx) => {
        // MVP : pas encore de file de modération (-> module Moderation à venir),
        // on publie directement plutôt que de laisser en 'pending' indéfiniment.
        const [recommendation] = await tx
          .insert(recommendations)
          .values({
            authorId,
            recipientId,
            relationship: dto.relationship,
            body: dto.body,
            status: 'published',
          })
          .returning();

        await tx.insert(reputationEvents).values({
          profileId: recipientId,
          eventType: 'recommendation_received',
          dimension: 'collaboration',
          points: points.toFixed(2),
          evidenceType: 'recommendation',
          evidenceId: recommendation.id,
          sourceProfileId: authorId,
          metadata: { relationship: dto.relationship },
        });

        await this.recalculate(tx, recipientId, 'collaboration');
        return recommendation;
      });

      await this.notificationsService.create({
        recipientId,
        actorId: authorId,
        type: 'recommendation_received',
        entityType: 'recommendation',
        entityId: recommendation.id,
        payload: { relationship: dto.relationship },
      });

      return recommendation;
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  /** GET /profiles/{id}/reputation — scores matérialisés + facteurs explicatifs. */
  async getReputation(profileId: string) {
    const [scores, factorRows] = await Promise.all([
      this.dbService.db
        .select()
        .from(reputationScores)
        .where(eq(reputationScores.profileId, profileId)),
      this.dbService.db
        .select({
          dimension: reputationEvents.dimension,
          eventType: reputationEvents.eventType,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(reputationEvents)
        .where(eq(reputationEvents.profileId, profileId))
        .groupBy(reputationEvents.dimension, reputationEvents.eventType),
    ]);

    const scoresByDimension = new Map(scores.map((s) => [s.dimension, s]));
    const factorsByDimension = new Map<ReputationDimension, { type: string; count: number }[]>();
    for (const row of factorRows) {
      const list = factorsByDimension.get(row.dimension) ?? [];
      list.push({ type: row.eventType, count: Number(row.count) });
      factorsByDimension.set(row.dimension, list);
    }

    const dimensions = new Set([...scoresByDimension.keys(), ...factorsByDimension.keys()]);
    const result = [...dimensions].map((dimension) => {
      const score = scoresByDimension.get(dimension);
      return {
        dimension,
        score: score ? Number(score.score) : 0,
        eventCount: score?.eventCount ?? 0,
        factors: factorsByDimension.get(dimension) ?? [],
      };
    });

    return { profileId, scores: result, calculatedAt: new Date().toISOString() };
  }

  /**
   * Recalcule entièrement le score d'une dimension à partir du journal
   * d'événements (ADR-003 : tout est recalculable, l'historique est la
   * source de vérité). Garde-fou : la contribution d'une même source est
   * plafonnée pour éviter qu'une seule relation domine le score.
   */
  private async recalculate(tx: DrizzleDb, profileId: string, dimension: ReputationDimension) {
    const events = await tx
      .select({ points: reputationEvents.points, sourceProfileId: reputationEvents.sourceProfileId })
      .from(reputationEvents)
      .where(and(eq(reputationEvents.profileId, profileId), eq(reputationEvents.dimension, dimension)));

    const bySource = new Map<string, number>();
    for (const ev of events) {
      const key = ev.sourceProfileId ?? 'system';
      bySource.set(key, (bySource.get(key) ?? 0) + Number(ev.points));
    }

    let total = 0;
    for (const subtotal of bySource.values()) {
      total += subtotal > 0 ? Math.min(subtotal, MAX_POINTS_PER_SOURCE) : subtotal;
    }
    const score = Math.max(0, Math.min(100, total));

    await tx
      .insert(reputationScores)
      .values({
        profileId,
        dimension,
        score: score.toFixed(2),
        eventCount: events.length,
        calculatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [reputationScores.profileId, reputationScores.dimension],
        set: { score: score.toFixed(2), eventCount: events.length, calculatedAt: new Date().toISOString() },
      });
  }

  /** Garde-fou ADR-003 : poids réduit pour un compte neuf ou non vérifié. */
  private async sourceWeightMultiplier(sourceProfileId: string): Promise<number> {
    const [row] = await this.dbService.db
      .select({ status: users.status, createdAt: users.createdAt })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.id, sourceProfileId))
      .limit(1);

    if (!row) return NEW_ACCOUNT_MULTIPLIER;

    const ageDays = (Date.now() - new Date(row.createdAt).getTime()) / 86_400_000;
    const isNewOrUnverified = row.status !== 'active' || ageDays < NEW_ACCOUNT_DAYS;
    return isNewOrUnverified ? NEW_ACCOUNT_MULTIPLIER : 1;
  }
}
