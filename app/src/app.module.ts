import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/db.module';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CommunityModule } from './modules/community/community.module';
import { TrustModule } from './modules/trust/trust.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    HealthModule,
    IdentityModule,
    ProfilesModule,
    SkillsModule,
    ProjectsModule,
    CommunityModule,
    TrustModule,
    SearchModule,
    NotificationsModule,
    ModerationModule,
  ],
})
export class AppModule {}
