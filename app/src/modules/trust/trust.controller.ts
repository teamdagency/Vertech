import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TrustService } from './trust.service';
import { EndorseSkillDto } from './dto/endorse-skill.dto';
import { RecommendDto } from './dto/recommend.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

@Controller('profiles/:id')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @UseGuards(JwtAuthGuard)
  @Post('endorsements')
  endorse(
    @Param('id') recipientId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: EndorseSkillDto,
  ) {
    return this.trustService.endorseSkill(recipientId, req.user.profileId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recommendations')
  recommend(
    @Param('id') recipientId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecommendDto,
  ) {
    return this.trustService.recommend(recipientId, req.user.profileId, dto);
  }

  @Get('reputation')
  getReputation(@Param('id') profileId: string) {
    return this.trustService.getReputation(profileId);
  }
}
