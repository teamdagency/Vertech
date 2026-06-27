import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

/**
 * Module Profiles — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Identité publique, disponibilité, liens
 * Ne calcule pas la réputation (-> Trust).
 */
@Module({
  imports: [IdentityModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
