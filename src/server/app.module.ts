import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { SiconfiModule } from './siconfi/siconfi.module';
import { BillingModule } from './billing/billing.module';
import { DiagnosticoModule } from './diagnostico/diagnostico.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RepositoriesModule,
    HealthModule,
    AuthModule,
    MunicipiosModule,
    TenantsModule,
    UsersModule,
    FiscalModule,
    SiconfiModule,
    BillingModule,
    DiagnosticoModule,
    IntegrationModule,
  ],
})
export class AppModule {}
