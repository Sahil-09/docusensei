import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users';
import { WebhooksModule } from '../webhook';
import { ConfigModule } from '@nestjs/config';
import { GenkitModule } from '../genkit';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    WebhooksModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GenkitModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
