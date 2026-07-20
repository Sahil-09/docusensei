import { Module } from '@nestjs/common';
import { GenkitService } from './genkit.service';
import { GenkitController } from './genkit.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [GenkitController],
  providers: [GenkitService],
})
export class GenkitModule {}
