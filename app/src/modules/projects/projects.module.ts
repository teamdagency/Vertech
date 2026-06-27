import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

/**
 * Module Projects — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Projets, preuves, médias, contributeurs
 * Ne détermine pas seul un score (-> Trust).
 */
@Module({
  imports: [IdentityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
