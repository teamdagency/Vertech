import { Module } from '@nestjs/common';

/**
 * Module Notifications — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Préférences et livraison des notifications
 * Ne porte pas de règles métier (-> autres modules).
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
export class NotificationsModule {}
