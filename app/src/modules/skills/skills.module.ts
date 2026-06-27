import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

/**
 * Module Skills — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Référentiel et compétences déclarées
 * Ne valide pas socialement une compétence (-> Trust).
 */
@Module({
  imports: [IdentityModule],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
