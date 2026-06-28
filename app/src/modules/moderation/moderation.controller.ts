import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  createReport(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(req.user.profileId, dto);
  }

  /** Réservé aux modérateurs/admins (vérifié dans le service). */
  @Get('reports')
  listReports(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: 'open' | 'reviewing' | 'resolved' | 'rejected',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderationService.listReports(
      req.user.profileId,
      status,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderationService.resolveReport(req.user.profileId, id, dto);
  }
}
