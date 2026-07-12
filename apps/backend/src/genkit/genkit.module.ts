import { Module } from '@nestjs/common';
import { GenkitService } from './genkit.service';
import { GenkitController } from './genkit.controller';

@Module({
  controllers: [GenkitController],
  providers: [GenkitService],
})
export class GenkitModule {}
