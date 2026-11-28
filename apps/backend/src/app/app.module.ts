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
    LoggerModule.forRoot({
      pinoHttp: {
        transport: !process.env.VERCEL
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
        formatters: {
          level: (label) => ({ level: label }),
        },
        serializers: {
          req(req: any) {
            return `${req.method} ${req.url} | query=${JSON.stringify(req.query)} | params=${JSON.stringify(req.params)} | host=${req.headers.host} | user-agent=${req.headers['user-agent']} | content-type=${req.headers['content-type']} | x-forwarded-for=${req.headers['x-forwarded-for']} | x-real-ip=${req.headers['x-real-ip']} | remoteAddress=${req.remoteAddress}`;
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
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
