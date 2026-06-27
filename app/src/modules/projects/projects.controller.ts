import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.profileId, dto);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const requesterProfileId = await this.tryDecodeProfileId(req);
    return this.projectsService.getBySlug(slug, requesterProfileId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.profileId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, req.user.profileId, dto);
  }

  /** Auth optionnelle pour la lecture (visibilité public/members/private). */
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
