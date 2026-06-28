import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Module Notifications — frontière métier définie dans
 * docs/architecture/README.md.
 *
 * Responsabilité : Préférences et livraison des notifications
 * Ne porte pas de règles métier (-> autres modules).
 *
 * Note de portée : aucune table de préférences n'existe encore dans
 * database/schema.sql — seule la livraison (création + lecture) est
 * implémentée pour cette phase. Les préférences nécessiteront une
 * migration de schéma à part.
 */
@Module({
  imports: [IdentityModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
