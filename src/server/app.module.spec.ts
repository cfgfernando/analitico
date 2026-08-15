import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { HealthController } from './health/health.controller';
import { FiscalController } from './fiscal/fiscal.controller';
import { FiscalService } from './fiscal/fiscal.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { SiconfiController } from './siconfi/siconfi.controller';
import { BillingController } from './billing/billing.controller';
import { MunicipiosService } from './municipios/municipios.service';

async function runNestTests() {
  console.log('--- [TESTE DE INTEGRAÇÃO FASE 1: ARQUITETURA MODULAR NESTJS] ---');
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

  // 1. Health Module
  const healthController = moduleRef.get<HealthController>(HealthController);
  assert(!!healthController, 'HealthController instanciado com sucesso');
  const health = healthController.checkHealth();
  assert(health.status === 'ok' && health.version === '4.0.0', 'GET /health retorna status ok e versão 4.0.0');

  // 2. Municipios Module
  const municipiosService = moduleRef.get<MunicipiosService>(MunicipiosService);
  assert(!!municipiosService, 'MunicipiosService injetado no container NestJS');
  const araucaria = municipiosService.discoverMunicipality('4101804');
  assert(araucaria?.cidade === 'Araucária', 'Auto-descoberta municipal por IBGE (4101804) funcional');

  // 3. Tenants & APIs Module
  const tenantsController = moduleRef.get<TenantsController>(TenantsController);
  const tenantsList = tenantsController.listTenants();
  assert(tenantsList.success && tenantsList.tenants.length >= 4, 'Listagem de prefeituras (SaaS Tenants) funcional');
  const araucariaApis = tenantsController.getTenantApis('tenant-araucaria');
  assert(araucariaApis.success && araucariaApis.apis.length >= 4, 'APIs mapeadas para Prefeitura de Araucária');

  // 4. Fiscal Engine Module
  const fiscalController = moduleRef.get<FiscalController>(FiscalController);
  const fakeReq: any = { query: { tenantId: 'tenant-araucaria', codigoIbge: '4101804' }, headers: {} };
  const summary = fiscalController.getSummary(fakeReq, '2026');
  assert(summary.rcl > 0 && summary.despesaPessoalPercentualRCL > 0, 'Motor fiscal calculou RCL e limite de pessoal');
  const receitasRes: any = fiscalController.getReceitas(fakeReq, '2026');
  const receitas = Array.isArray(receitasRes) ? receitasRes : receitasRes.receitas;
  assert(Array.isArray(receitas) && receitas.length > 0, 'Motor fiscal retornou receitas orçamentárias (ICMS/REPAR/ISS)');
  const despesas = fiscalController.getDespesas(fakeReq, '2026');
  assert(despesas.porNatureza.length > 0 && despesas.porFuncao.length > 0, 'Motor fiscal retornou despesas por função e natureza');

  // 5. Siconfi Module
  const siconfiController = moduleRef.get<SiconfiController>(SiconfiController);
  assert(!!siconfiController, 'SiconfiController instanciado com sucesso');

  // 6. Billing Module
  const billingController = moduleRef.get<BillingController>(BillingController);
  const metrics = billingController.getMetrics();
  assert(metrics.success && metrics.metrics.totalPrefeituras >= 4, 'Cálculo de métricas SaaS (MRR/ARR) funcional');

  console.log(`\nResultado da Fase 1: ${passCount}/${totalCount} testes passaram com sucesso no NestJS.`);
}

runNestTests().catch(err => {
  console.error('Erro fatal no teste NestJS:', err);
  process.exit(1);
});
