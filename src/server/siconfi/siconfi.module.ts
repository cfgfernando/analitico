import { Module } from '@nestjs/common';
import { SiconfiService } from './siconfi.service';
import { SiconfiController } from './siconfi.controller';

@Module({
  controllers: [SiconfiController],
  providers: [SiconfiService],
  exports: [SiconfiService],
})
export class SiconfiModule {}
