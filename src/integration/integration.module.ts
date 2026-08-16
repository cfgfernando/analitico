import { Module, forwardRef } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { FiscalModule } from '../server/fiscal/fiscal.module';

@Module({
  imports: [forwardRef(() => FiscalModule)],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
