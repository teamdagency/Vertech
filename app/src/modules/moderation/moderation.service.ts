import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DbService } from '../../drizzle/db.service';
import * as schema from '../../drizzle/schema';
import {
  reports,
  auditLogs,
  profiles,
  users,
  projects,
  posts,
  comments,
  reportTarget,
  reportStatus,
} from '../../drizzle/schema';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

type ReportTargetType = (typeof reportTarget.enumValues)[number];
type ReportStatusType = (typeof reportStatus.enumValues)[number];
type DrizzleDb = NodePgDatabase<typeof schema>;

const TARGET_TABLES = { profile: profiles, project: projects, post: posts, comment: comments } as const;

@Injectable()
export class ModerationService {
  constructor(private readonly dbService: DbService) {}

  /** RG (MOT "Signaler contenu") : contrôle unicité sur signalement ouvert/en cours. */
  async createReport(reporterId: string, dto: CreateReportDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const [existing] = await this.dbService.db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, reporterId),
          eq(reports.targetType, dto.targetType),
          eq(reports.targetId, dto.targetId),
          inArray(reports.status, ['open', 'reviewing']),
        ),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException('Vous avez déjà signalé cette ressource, son traitement est en cours.');
    }

    const [report] = await this.dbService.db
      .insert(reports)
      .values({
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      })
      .returning();

    await this.dbService.db.insert(auditLogs).values({
      actorId: reporterId,
      action: 'report_created',
      entityType: dto.targetType,
      entityId: dto.targetId,
      afterState: { reportId: report.id, reason: dto.reason },
    });

    return report;
  }

  /** File de modération — réservée aux comptes role=moderator|admin. */
  async listReports(moderatorProfileId: string, status?: ReportStatusType, limit = 20, offset = 0) {
    await this.assertModerator(moderatorProfileId);
    return this.dbService.db
      .select()
      .from(reports)
      .where(eq(reports.status, status ?? 'open'))
      .orderBy(reports.createdAt)
      .limit(limit)
      .offset(offset);
  }

  /** Décision journalisée ; le contenu est masqué (deleted_at), jamais effacé. */
  async resolveReport(moderatorProfileId: string, reportId: string, dto: ResolveReportDto) {
    await this.assertModerator(moderatorProfileId);

    const [report] = await this.dbService.db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!report) throw new NotFoundException('Signalement introuvable.');
    if (report.status === 'resolved' || report.status === 'rejected') {
      throw new ConflictException('Ce signalement a déjà été traité.');
    }

    return this.dbService.db.transaction(async (tx) => {
      if (dto.decision === 'resolved' && dto.hideContent && report.targetType !== 'profile') {
        await this.hideTarget(tx, report.targetType, report.targetId, moderatorProfileId);
      }

      const [updated] = await tx
        .update(reports)
        .set({
          status: dto.decision,
          moderatorId: moderatorProfileId,
          resolutionNote: dto.resolutionNote,
          resolvedAt: new Date().toISOString(),
        })
        .where(eq(reports.id, reportId))
        .returning();

      await tx.insert(auditLogs).values({
        actorId: moderatorProfileId,
        action: 'report_resolved',
        entityType: 'report',
        entityId: reportId,
        beforeState: { status: report.status },
        afterState: { status: dto.decision, resolutionNote: dto.resolutionNote ?? null },
      });

      return updated;
    });
  }

  private async hideTarget(
    tx: DrizzleDb,
    targetType: 'project' | 'post' | 'comment',
    targetId: string,
    moderatorProfileId: string,
  ) {
    const table = TARGET_TABLES[targetType];
    const [before] = await tx
      .select({ deletedAt: table.deletedAt })
      .from(table)
      .where(eq(table.id, targetId))
      .limit(1);

    const now = new Date().toISOString();
    await tx.update(table).set({ deletedAt: now }).where(eq(table.id, targetId));

    await tx.insert(auditLogs).values({
      actorId: moderatorProfileId,
      action: 'content_hidden',
      entityType: targetType,
      entityId: targetId,
      beforeState: { deletedAt: before?.deletedAt ?? null },
      afterState: { deletedAt: now },
    });
  }

  private async assertTargetExists(targetType: ReportTargetType, targetId: string) {
    const table = TARGET_TABLES[targetType];
    const [row] = await this.dbService.db.select({ id: table.id }).from(table).where(eq(table.id, targetId)).limit(1);
    if (!row) throw new BadRequestException('Ressource cible introuvable.');
  }

  private async assertModerator(profileId: string) {
    const [row] = await this.dbService.db
      .select({ role: users.role })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.id, profileId))
      .limit(1);
    if (!row || (row.role !== 'moderator' && row.role !== 'admin')) {
      throw new ForbiddenException('Action réservée aux modérateurs.');
    }
  }
}
