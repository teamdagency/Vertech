import { Module } from '@nestjs/common';

/**
 * Module Projects — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Projets, preuves, médias, contributeurs
 * Ne détermine pas seul un score (-> Trust).
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
export class ProjectsModule {}
