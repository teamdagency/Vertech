import { Module } from '@nestjs/common';

/**
 * Module Moderation — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Signalements, décisions et audit
 * N'efface jamais l'historique sans trace (-> audit_logs).
 *
 * Squelette de base : providers/controllers à ajouter au fil de
 * l'implémentation du contrat API (docs/api/README.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ModerationModule {}
