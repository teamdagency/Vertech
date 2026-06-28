import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

/**
 * Module Trust — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Validations, recommandations, journal et scores de
 * réputation (ADR-003).
 * Ne modifie pas une preuve source (-> Projects/Skills).
 */
@Module({
  imports: [IdentityModule],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
