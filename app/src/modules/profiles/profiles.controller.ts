import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../identity/jwt-auth.guard';

@Controller()
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('profiles')
  search(@Query() query: SearchProfilesDto) {
    return this.profilesService.search(query);
  }

  @Get('profiles/:username')
  async getByUsername(@Param('username') username: string, @Req() req: Request) {
    const requesterProfileId = await this.tryDecodeProfileId(req);
    return this.profilesService.getByUsername(username, requesterProfileId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateMe(req.user.profileId, dto);
  }

  /** Auth optionnelle : ne lève jamais d'erreur, renvoie undefined si absent/invalide. */
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
