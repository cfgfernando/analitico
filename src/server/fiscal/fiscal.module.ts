import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { DataProvenanceService } from './data-provenance.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FiscalController],
  providers: [FiscalService, DataProvenanceService],
  exports: [FiscalService, DataProvenanceService],
})
export class FiscalModule {}
