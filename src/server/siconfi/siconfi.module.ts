import { Module, forwardRef } from '@nestjs/common';
import { SiconfiService } from './siconfi.service';
import { SiconfiSyncService } from './siconfi-sync.service';
import { SiconfiController } from './siconfi.controller';
import { FiscalModule } from '../fiscal/fiscal.module';

@Module({
  imports: [forwardRef(() => FiscalModule)],
  controllers: [SiconfiController],
  providers: [SiconfiService, SiconfiSyncService],
  exports: [SiconfiService, SiconfiSyncService],
})
export class SiconfiModule {}
