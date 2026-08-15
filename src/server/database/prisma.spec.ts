import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from './prisma.service';
import { TenantsRepository } from '../repositories/tenants.repository';
import { UsersRepository } from '../repositories/users.repository';
import { FinancialRepository } from '../repositories/financial.repository';

async function runPrismaTests() {
  console.log('--- [TESTE DE PERSISTÊNCIA FASE 2: MYSQL 8 + PRISMA ORM] ---');
  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      throw new Error(`Falha no teste: ${testName}`);
    }
  }

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // 1. PrismaService
  const prismaService = moduleRef.get<PrismaService>(PrismaService);
  assert(!!prismaService, 'PrismaService instanciado e injetado globalmente');

  // 2. TenantsRepository
  const tenantsRepo = moduleRef.get<TenantsRepository>(TenantsRepository);
  assert(!!tenantsRepo, 'TenantsRepository instanciado com suporte a tenant_id');

  // 3. UsersRepository
  const usersRepo = moduleRef.get<UsersRepository>(UsersRepository);
  assert(!!usersRepo, 'UsersRepository instanciado');

  // 4. FinancialRepository
  const financialRepo = moduleRef.get<FinancialRepository>(FinancialRepository);
  assert(!!financialRepo, 'FinancialRepository instanciado para dados do Siconfi/TCE');

  console.log(`\nResultado da Fase 2: ${passCount}/${totalCount} testes de persistência passaram com sucesso.`);
}

runPrismaTests().catch((err) => {
  console.error('Erro no teste Prisma:', err);
  process.exit(1);
});
