import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../server/app.module';
import { FiscalController } from '../server/fiscal/fiscal.controller';

async function runDataSourceBadgeTests() {
  console.log('--- [TESTE DE TRANSPARÊNCIA E ORIGEM DE DADOS FASE 4: DATA SOURCE BADGE] ---');
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

  const fiscalController = moduleRef.get<FiscalController>(FiscalController);
  const fakeReq: any = { query: { tenantId: 'tenant-araucaria', codigoIbge: '4101804' }, headers: {} };

  // 1. Validar metadado dataSource no Summary (KPIs)
  const summary: any = fiscalController.getSummary(fakeReq, '2026');
  assert(!!summary.dataSource, 'Summary fiscal inclui objeto dataSource');
  assert(
    summary.dataSource.origin === 'DEMONSTRACAO' || summary.dataSource.origin === 'OFICIAL',
    'Origin do Summary é estritamente OFICIAL ou DEMONSTRACAO'
  );
  assert(!!summary.dataSource.source && summary.dataSource.source.length > 0, 'Metadado contém descrição explícita da fonte');

  // 2. Validar metadado dataSource nas Receitas
  const receitasRes: any = fiscalController.getReceitas(fakeReq, '2026');
  assert(!!receitasRes.dataSource, 'Receitas orçamentárias incluem metadados de rastreabilidade de dados');
  assert(
    receitasRes.dataSource.origin === 'DEMONSTRACAO',
    'Dados de modelo estatístico/LOA são transparentemente marcados como DEMONSTRACAO'
  );

  // 3. Validar metadado dataSource nas Despesas
  const despesasRes: any = fiscalController.getDespesas(fakeReq, '2026');
  assert(!!despesasRes.dataSource, 'Despesas por natureza e função incluem metadado dataSource');

  // 4. Validar metadado dataSource nos Limites LRF
  const limitesRes: any = fiscalController.getLimites(fakeReq, '2026');
  assert(!!limitesRes.dataSource, 'Limites fiscais da LRF incluem metadado dataSource');

  console.log(`\nResultado da Fase 4: ${passCount}/${totalCount} testes de DataSourceBadge e transparência passaram com sucesso.`);
}

runDataSourceBadgeTests().catch((err) => {
  console.error('Erro fatal no teste de DataSourceBadge:', err);
  process.exit(1);
});
