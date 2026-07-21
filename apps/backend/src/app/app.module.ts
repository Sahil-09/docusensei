import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users';
import { WebhooksModule } from '../webhook';
import { ConfigModule } from '@nestjs/config';
import { GenkitModule } from '../genkit';
import { ChatsModule } from '../chats/chats.module';
import { SharedModule } from '../shared/shared.module';
import { LoggerModule } from 'nestjs-pino';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    WebhooksModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GenkitModule,
    ChatsModule,
    SharedModule,
    LoggerModule.forRoot(),
    SentryModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
