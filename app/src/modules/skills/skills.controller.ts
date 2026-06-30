import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SearchSkillsDto } from './dto/search-skills.dto';
import { DeclareSkillDto } from './dto/declare-skill.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('skills')
  search(@Query() query: SearchSkillsDto) {
    return this.skillsService.search(query);
  }

  @Get('profiles/:id/skills')
  listForProfile(@Param('id') profileId: string) {
    return this.skillsService.listForProfile(profileId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/skills/:skillId')
  declare(
    @Param('skillId') skillId: string,
    @Body() dto: DeclareSkillDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.skillsService.declare(req.user.profileId, skillId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/skills/:skillId')
  remove(@Param('skillId') skillId: string, @Req() req: AuthenticatedRequest) {
    return this.skillsService.remove(req.user.profileId, skillId);
  }
}
