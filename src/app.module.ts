import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { SrsModule } from './srs/srs.module';
import { QuizModule } from './quiz/quiz.module';
import { CollectionModule } from './collection/collection.module';
import { NotesModule } from './notes/notes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    VocabularyModule,
    DictionaryModule,
    SrsModule,
    QuizModule,
    CollectionModule,
    NotesModule,
    AnalyticsModule,
    DashboardModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}
