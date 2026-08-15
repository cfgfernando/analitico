import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantsRepository } from './tenants.repository';
import { UsersRepository } from './users.repository';
import { FinancialRepository } from './financial.repository';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [TenantsRepository, UsersRepository, FinancialRepository],
  exports: [TenantsRepository, UsersRepository, FinancialRepository],
})
export class RepositoriesModule {}
