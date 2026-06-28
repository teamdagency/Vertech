import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gt, ilike, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import {
  communityGroups,
  groupMemberships,
  posts,
  comments,
  postReactions,
  profiles,
} from '../../drizzle/schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPageDto } from './dto/cursor-page.dto';
import { mapPgError } from '../../common/pg-error.util';
import { decodeCursor, encodeCursor } from '../../common/cursor.util';
import { NotificationsService } from '../notifications/notifications.service';

const CONSTRAINT_MESSAGES = {
  community_groups_slug_key: 'Ce slug de groupe est déjà utilisé.',
};

const REACTION_KINDS = ['like', 'useful', 'celebrate'] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

@Injectable()
export class CommunityService {
  constructor(
    private readonly dbService: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Pas de trigger DB pour les groupes (contrairement à projects) :
   * l'auto-adhésion du propriétaire est gérée ici, dans la transaction.
   */
  async createGroup(ownerId: string, dto: CreateGroupDto) {
    try {
      return await this.dbService.db.transaction(async (tx) => {
        const [group] = await tx
          .insert(communityGroups)
          .values({
            ownerId,
            name: dto.name,
            slug: dto.slug,
            description: dto.description,
            visibility: dto.visibility,
          })
          .returning();

        await tx.insert(groupMemberships).values({
          groupId: group.id,
          profileId: ownerId,
          role: 'owner',
          status: 'active',
          joinedAt: new Date().toISOString(),
        });

        return group;
      });
    } catch (err) {
      throw mapPgError(err, CONSTRAINT_MESSAGES);
    }
  }

  async listGroups(requesterProfileId: string | undefined, search?: string, limit = 20, offset = 0) {
    const activeGroupIds = requesterProfileId ? await this.activeGroupIds(requesterProfileId) : [];

    const visibilityFilter =
      activeGroupIds.length > 0
        ? or(eq(communityGroups.visibility, 'public'), inArray(communityGroups.id, activeGroupIds))
        : eq(communityGroups.visibility, 'public');

    const conditions = [isNull(communityGroups.deletedAt), visibilityFilter];
    if (search) conditions.push(ilike(communityGroups.name, `%${search}%`));

    const items = await this.dbService.db
      .select()
      .from(communityGroups)
      .where(and(...conditions))
      .orderBy(communityGroups.name)
      .limit(limit)
      .offset(offset);

    return { items, limit, offset };
  }

  /** RG implicite : statut selon la visibilité du groupe (cf. cycle d'adhésion, docs/merise/04-traitements.md). */
  async joinGroup(groupId: string, profileId: string) {
    const [group] = await this.dbService.db
      .select()
      .from(communityGroups)
      .where(and(eq(communityGroups.id, groupId), isNull(communityGroups.deletedAt)))
      .limit(1);
    if (!group) throw new NotFoundException('Groupe introuvable.');

    const [existing] = await this.dbService.db
      .select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.profileId, profileId)))
      .limit(1);

    if (existing) {
      if (existing.status === 'banned') {
        throw new ForbiddenException('Vous ne pouvez pas rejoindre ce groupe.');
      }
      return existing; // idempotent : adhésion déjà demandée/active
    }

    const isPublic = group.visibility === 'public';
    const [membership] = await this.dbService.db
      .insert(groupMemberships)
      .values({
        groupId,
        profileId,
        role: 'member',
        status: isPublic ? 'active' : 'pending',
        joinedAt: isPublic ? new Date().toISOString() : null,
      })
      .returning();

    return membership;
  }

  /** Un post de groupe exige une adhésion active à ce groupe. */
  async createPost(authorId: string, dto: CreatePostDto) {
    if (dto.groupId) {
      const activeIds = await this.activeGroupIds(authorId);
      if (!activeIds.includes(dto.groupId)) {
        throw new ForbiddenException('Vous devez être membre actif du groupe pour y publier.');
      }
    }

    try {
      const [post] = await this.dbService.db
        .insert(posts)
        .values({
          authorId,
          groupId: dto.groupId,
          projectId: dto.projectId,
          kind: dto.kind,
          body: dto.body,
          visibility: dto.visibility,
        })
        .returning();
      return post;
    } catch (err) {
      throw mapPgError(err);
    }
  }

  /** GET /feed — public + posts des groupes où le membre est actif. */
  async getFeed(requesterProfileId: string | undefined, page: CursorPageDto) {
    const activeIds = requesterProfileId ? await this.activeGroupIds(requesterProfileId) : [];
    const limit = page.limit ?? 20;

    const publicUngrouped = and(eq(posts.visibility, 'public'), isNull(posts.groupId))!;
    const reachable =
      activeIds.length > 0 ? or(publicUngrouped, inArray(posts.groupId, activeIds))! : publicUngrouped;

    const conditions = [isNull(posts.deletedAt), reachable];
    const cur = page.cursor ? decodeCursor(page.cursor) : undefined;
    if (cur) {
      conditions.push(
        or(lt(posts.createdAt, cur.createdAt), and(eq(posts.createdAt, cur.createdAt), lt(posts.id, cur.id)))!,
      );
    }

    const rows = await this.dbService.db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        authorUsername: profiles.username,
        authorDisplayName: profiles.displayName,
        groupId: posts.groupId,
        projectId: posts.projectId,
        kind: posts.kind,
        body: posts.body,
        visibility: posts.visibility,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .innerJoin(profiles, eq(profiles.id, posts.authorId))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page_ = hasMore ? rows.slice(0, limit) : rows;
    const counts = await this.engagementCounts(page_.map((p) => p.id));

    return {
      items: page_.map((p) => ({ ...p, ...counts.get(p.id) })),
      nextCursor: hasMore ? encodeCursor(page_[page_.length - 1].createdAt, page_[page_.length - 1].id) : null,
    };
  }

  /** GET /posts/{id}/comments — ajout non documenté explicitement dans le contrat mais nécessaire à la lecture. */
  async getComments(postId: string, requesterProfileId: string | undefined, page: CursorPageDto) {
    await this.assertCanViewPost(postId, requesterProfileId);
    const limit = page.limit ?? 20;

    const conditions = [eq(comments.postId, postId), isNull(comments.deletedAt)];
    const cur = page.cursor ? decodeCursor(page.cursor) : undefined;
    if (cur) {
      conditions.push(
        or(gt(comments.createdAt, cur.createdAt), and(eq(comments.createdAt, cur.createdAt), gt(comments.id, cur.id)))!,
      );
    }

    const rows = await this.dbService.db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        authorUsername: profiles.username,
        parentId: comments.parentId,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(profiles, eq(profiles.id, comments.authorId))
      .where(and(...conditions))
      .orderBy(comments.createdAt, comments.id)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page_ = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page_,
      nextCursor: hasMore ? encodeCursor(page_[page_.length - 1].createdAt, page_[page_.length - 1].id) : null,
    };
  }

  async addComment(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.assertCanViewPost(postId, authorId);

    // Pré-vérification applicative (le trigger SQL validate_comment_parent
    // lèverait sinon une exception brute peu exploitable côté API).
    if (dto.parentId) {
      const [parent] = await this.dbService.db
        .select({ postId: comments.postId })
        .from(comments)
        .where(eq(comments.id, dto.parentId))
        .limit(1);
      if (!parent) throw new BadRequestException('Commentaire parent introuvable.');
      if (parent.postId !== postId) {
        throw new BadRequestException('Le commentaire parent doit appartenir au même post.');
      }
    }

    try {
      const [comment] = await this.dbService.db
        .insert(comments)
        .values({ postId, authorId, parentId: dto.parentId, body: dto.body })
        .returning();

      await this.notificationsService.create({
        recipientId: post.authorId,
        actorId: authorId,
        type: 'comment_received',
        entityType: 'comment',
        entityId: comment.id,
        payload: { postId },
      });

      return comment;
    } catch (err) {
      throw mapPgError(err);
    }
  }

  /** PUT idempotent : un re-PUT identique ne fait rien (PK post+profil+kind). */
  async reactToPost(postId: string, profileId: string, kind: ReactionKind) {
    await this.assertCanViewPost(postId, profileId);
    await this.dbService.db
      .insert(postReactions)
      .values({ postId, profileId, kind })
      .onConflictDoNothing({ target: [postReactions.postId, postReactions.profileId, postReactions.kind] });
    return { postId, kind, reacted: true };
  }

  async removeReaction(postId: string, profileId: string, kind: ReactionKind) {
    await this.dbService.db
      .delete(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.profileId, profileId),
          eq(postReactions.kind, kind),
        ),
      );
    return { postId, kind, reacted: false };
  }

  private async activeGroupIds(profileId: string): Promise<string[]> {
    const rows = await this.dbService.db
      .select({ groupId: groupMemberships.groupId })
      .from(groupMemberships)
      .where(and(eq(groupMemberships.profileId, profileId), eq(groupMemberships.status, 'active')));
    return rows.map((r) => r.groupId);
  }

  private async engagementCounts(postIds: string[]) {
    const result = new Map<string, { commentCount: number; reactionCount: number }>();
    if (postIds.length === 0) return result;

    const [commentCounts, reactionCounts] = await Promise.all([
      this.dbService.db
        .select({ postId: comments.postId, count: sql<number>`count(*)`.as('count') })
        .from(comments)
        .where(and(inArray(comments.postId, postIds), isNull(comments.deletedAt)))
        .groupBy(comments.postId),
      this.dbService.db
        .select({ postId: postReactions.postId, count: sql<number>`count(*)`.as('count') })
        .from(postReactions)
        .where(inArray(postReactions.postId, postIds))
        .groupBy(postReactions.postId),
    ]);

    for (const id of postIds) result.set(id, { commentCount: 0, reactionCount: 0 });
    for (const row of commentCounts) result.set(row.postId, { ...result.get(row.postId)!, commentCount: Number(row.count) });
    for (const row of reactionCounts) result.set(row.postId, { ...result.get(row.postId)!, reactionCount: Number(row.count) });
    return result;
  }

  private async assertCanViewPost(postId: string, requesterProfileId: string | undefined) {
    const [post] = await this.dbService.db
      .select({ visibility: posts.visibility, groupId: posts.groupId, authorId: posts.authorId })
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);
    if (!post) throw new NotFoundException('Publication introuvable.');

    if (post.authorId === requesterProfileId) return post;
    if (post.visibility === 'public' && !post.groupId) return post;

    if (post.groupId) {
      const activeIds = requesterProfileId ? await this.activeGroupIds(requesterProfileId) : [];
      if (activeIds.includes(post.groupId)) return post;
      throw new NotFoundException('Publication introuvable.');
    }

    if (post.visibility === 'members' && requesterProfileId) return post;
    throw new NotFoundException('Publication introuvable.');
  }
}
