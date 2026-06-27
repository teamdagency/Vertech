import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { DbService } from '../../drizzle/db.service';
import { users, profiles } from '../../drizzle/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { mapPgError } from '../../common/pg-error.util';

@Injectable()
export class IdentityService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * RG-01 : un compte possède exactement un profil membre.
   * user + profile sont créés dans une seule transaction (cf. flux
   * d'écriture décrit dans docs/architecture/README.md).
   */
  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password);

    try {
      const created = await this.dbService.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: dto.email, passwordHash })
          .returning({ id: users.id, email: users.email, status: users.status });

        const [profile] = await tx
          .insert(profiles)
          .values({
            userId: user.id,
            username: dto.username,
            displayName: dto.displayName,
          })
          .returning({ id: profiles.id, username: profiles.username });

        return { user, profile };
      });

      return this.issueSession(created.user.id, created.profile.id, 'member');
    } catch (err) {
      throw mapPgError(err, {
        users_email_key: 'Cette adresse e-mail est déjà utilisée.',
        profiles_username_key: "Ce nom d'utilisateur est déjà pris.",
      });
    }
  }

  async login(dto: LoginDto) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const validPassword = await verify(user.passwordHash, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    if (user.status === 'suspended' || user.status === 'deleted') {
      throw new UnauthorizedException('Compte indisponible.');
    }

    const [profile] = await this.dbService.db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    await this.dbService.db
      .update(users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    return this.issueSession(user.id, profile.id, user.role);
  }

  private async issueSession(userId: string, profileId: string, role: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      profileId,
      role,
    });
    return { accessToken, userId, profileId, role };
  }
}
