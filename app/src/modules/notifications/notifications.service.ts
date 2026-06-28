import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { notifications } from '../../drizzle/schema';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { decodeCursor, encodeCursor } from '../../common/cursor.util';

@Injectable()
export class NotificationsService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Appelé par les autres modules (Trust, Community...) en conséquence
   * d'un de leurs événements. Notifications ne décide jamais elle-même
   * quand notifier (-> pas de règle métier ici).
   */
  async create(params: {
    recipientId: string;
    actorId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  }) {
    // Pas d'auto-notification (ex: commenter son propre post).
    if (params.actorId && params.actorId === params.recipientId) return null;

    const [notification] = await this.dbService.db
      .insert(notifications)
      .values({
        recipientId: params.recipientId,
        actorId: params.actorId,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        payload: params.payload ?? {},
      })
      .returning();
    return notification;
  }

  async list(profileId: string, dto: ListNotificationsDto) {
    const limit = dto.limit ?? 20;
    const conditions = [eq(notifications.recipientId, profileId)];
    if (dto.unreadOnly) conditions.push(isNull(notifications.readAt));

    const cur = dto.cursor ? decodeCursor(dto.cursor) : undefined;
    if (cur) {
      conditions.push(
        or(
          lt(notifications.createdAt, cur.createdAt),
          and(eq(notifications.createdAt, cur.createdAt), lt(notifications.id, cur.id)),
        )!,
      );
    }

    const rows = await this.dbService.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const [{ unread }] = await this.dbService.db
      .select({ unread: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.recipientId, profileId), isNull(notifications.readAt)));

    return {
      items: page,
      unreadCount: Number(unread),
      nextCursor: hasMore ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id) : null,
    };
  }

  async markAsRead(profileId: string, notificationId: string) {
    const [updated] = await this.dbService.db
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, profileId)))
      .returning();

    if (!updated) throw new NotFoundException('Notification introuvable.');
    return updated;
  }
}
