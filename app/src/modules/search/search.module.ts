import { Module } from '@nestjs/common';

/**
 * Module Search — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Indexation et filtres de découverte
 * N'est pas la source de vérité (-> PostgreSQL).
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
export class SearchModule {}
