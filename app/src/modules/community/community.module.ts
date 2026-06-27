import { Module } from '@nestjs/common';

/**
 * Module Community — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Groupes, posts, commentaires, réactions
 * N'authentifie pas les comptes (-> Identity).
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
export class CommunityModule {}
