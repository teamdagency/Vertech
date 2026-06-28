import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

/**
 * Module Moderation — frontière métier définie dans
 * docs/architecture/README.md.
 *
 * Responsabilité : Signalements, décisions et audit
 * N'efface jamais l'historique sans trace (-> audit_logs).
 *
 * Note de portée : la promotion d'un compte en role=moderator/admin
 * n'a pas d'API dédiée pour cette phase (action DB directe) — aucun
 * module Admin n'existe encore.
 */
@Module({
  imports: [IdentityModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
