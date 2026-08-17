import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { PainelController } from './painel.controller';
import { DataProvenanceService } from './data-provenance.service';
import { AutoSyncSchedulerService } from './auto-sync-scheduler.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FiscalController, PainelController],
  providers: [FiscalService, DataProvenanceService, AutoSyncSchedulerService],
  exports: [FiscalService, DataProvenanceService, AutoSyncSchedulerService],
})
export class FiscalModule {}
