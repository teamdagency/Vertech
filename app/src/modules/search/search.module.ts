import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

/**
 * Module Search — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Indexation et filtres de découverte
 * N'est pas la source de vérité (-> PostgreSQL).
 */
@Module({
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
