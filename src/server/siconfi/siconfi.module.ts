import { Module } from '@nestjs/common';
import { SiconfiService } from './siconfi.service';
import { SiconfiSyncService } from './siconfi-sync.service';
import { SiconfiController } from './siconfi.controller';

@Module({
  controllers: [SiconfiController],
  providers: [SiconfiService, SiconfiSyncService],
  exports: [SiconfiService, SiconfiSyncService],
})
export class SiconfiModule {}
