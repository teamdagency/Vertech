import { Module } from '@nestjs/common';

/**
 * Module Identity — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Authentification, rôles, statut du compte
 * Ne gère pas le contenu du profil (-> Profiles).
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
export class IdentityModule {}
