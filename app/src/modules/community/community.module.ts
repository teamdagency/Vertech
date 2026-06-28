import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

/**
 * Module Community — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Groupes, posts, commentaires, réactions
 * N'authentifie pas les comptes (-> Identity).
 */
@Module({
  imports: [IdentityModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
