import { Module } from '@nestjs/common';
import { MunicipiosService } from './municipios.service';

@Module({
  providers: [MunicipiosService],
  exports: [MunicipiosService],
})
export class MunicipiosModule {}
