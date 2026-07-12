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
    ChatsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
