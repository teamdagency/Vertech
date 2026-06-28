import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CommunityService, ReactionKind } from './community.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPageDto } from './dto/cursor-page.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

const REACTION_KINDS = ['like', 'useful', 'celebrate'];

@Controller()
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('groups')
  createGroup(@Req() req: AuthenticatedRequest, @Body() dto: CreateGroupDto) {
    return this.communityService.createGroup(req.user.profileId, dto);
  }

  @Get('groups')
  async listGroups(@Req() req: Request, @Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const requesterProfileId = await this.tryDecodeProfileId(req);
    return this.communityService.listGroups(
      requesterProfileId,
      search,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('groups/:id/memberships')
  joinGroup(@Param('id') groupId: string, @Req() req: AuthenticatedRequest) {
    return this.communityService.joinGroup(groupId, req.user.profileId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(@Req() req: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.profileId, dto);
  }

  @Get('feed')
  async getFeed(@Req() req: Request, @Query() page: CursorPageDto) {
    const requesterProfileId = await this.tryDecodeProfileId(req);
    return this.communityService.getFeed(requesterProfileId, page);
  }

  @Get('posts/:id/comments')
  async getComments(@Param('id') postId: string, @Req() req: Request, @Query() page: CursorPageDto) {
    const requesterProfileId = await this.tryDecodeProfileId(req);
    return this.communityService.getComments(postId, requesterProfileId, page);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  addComment(
    @Param('id') postId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.addComment(postId, req.user.profileId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('posts/:id/reactions/:kind')
  react(@Param('id') postId: string, @Param('kind') kind: string, @Req() req: AuthenticatedRequest) {
    this.assertReactionKind(kind);
    return this.communityService.reactToPost(postId, req.user.profileId, kind as ReactionKind);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id/reactions/:kind')
  unreact(@Param('id') postId: string, @Param('kind') kind: string, @Req() req: AuthenticatedRequest) {
    this.assertReactionKind(kind);
    return this.communityService.removeReaction(postId, req.user.profileId, kind as ReactionKind);
  }

  private assertReactionKind(kind: string) {
    if (!REACTION_KINDS.includes(kind)) {
      throw new BadRequestException(`Réaction invalide. Valeurs acceptées : ${REACTION_KINDS.join(', ')}.`);
    }
  }

  /** Auth optionnelle pour la lecture (feed, groupes, commentaires). */
  private async tryDecodeProfileId(req: Request): Promise<string | undefined> {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) return undefined;
    try {
      const payload = await this.jwtService.verifyAsync<{ profileId: string }>(token);
      return payload.profileId;
    } catch {
      return undefined;
    }
  }
}
