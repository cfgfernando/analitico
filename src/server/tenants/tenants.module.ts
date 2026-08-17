import { Module, forwardRef } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { MunicipiosModule } from '../municipios/municipios.module';
import { SiconfiModule } from '../siconfi/siconfi.module';

@Module({
  imports: [MunicipiosModule, forwardRef(() => SiconfiModule)],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
