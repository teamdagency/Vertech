import { Module } from '@nestjs/common';

/**
 * Module Trust — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Validations, recommandations, journal et scores de réputation
 * Ne modifie pas une preuve source (-> Projects/Skills).
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
export class TrustModule {}
