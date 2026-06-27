import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Module Identity — frontière métier définie dans docs/architecture/README.md.
 *
 * Responsabilité : Authentification, rôles, statut du compte
 * Ne gère pas le contenu du profil (-> Profiles).
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'changeme-dev-secret-do-not-use-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [IdentityController],
  providers: [IdentityService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class IdentityModule {}
