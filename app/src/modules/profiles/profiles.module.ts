import { Module } from '@nestjs/common';

/**
 * Module Profiles — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Identité publique, disponibilité, liens
 * Ne calcule pas la réputation (-> Trust).
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
export class ProfilesModule {}
