import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { SiconfiSyncService } from './siconfi-sync.service';
import { SiconfiService } from './siconfi.service';
import { SiconfiClient } from './siconfi-client';
import { SiconfiController } from './siconfi.controller';

async function runSiconfiTests() {
  console.log('--- [TESTE DE SINCRONIZAÇÃO SICONFI REAL FASE 5: NESTJS] ---');
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

  const syncService = moduleRef.get<SiconfiSyncService>(SiconfiSyncService);
  const siconfiService = moduleRef.get<SiconfiService>(SiconfiService);
  const siconfiController = moduleRef.get<SiconfiController>(SiconfiController);

  // =========================================================================
  // 1. Instanciação e injeção do serviço
  // =========================================================================
  assert(!!syncService, 'SiconfiSyncService injetado com sucesso no container NestJS');
  assert(!!siconfiService, 'SiconfiService injetado com sucesso no container NestJS');
  assert(!!siconfiController, 'SiconfiController instanciado no módulo');

  // =========================================================================
  // 2. Health check da API Siconfi / Tesouro Nacional
  // =========================================================================
  const health = await SiconfiClient.checkHealth();
  assert(typeof health.online === 'boolean' && health.latencyMs >= 0, 'SiconfiClient reporta conectividade e latência');
  assert(health.provider === 'SICONFI_DATA_LAKE', 'Health check identifica provedor SICONFI_DATA_LAKE');

  // =========================================================================
  // 3. Execução do pipeline de sincronização contábil (Araucária - IBGE 4101804)
  // =========================================================================
  const syncResult = await syncService.syncTenant('tenant-araucaria', 2026);
  assert(syncResult.status === 'SUCESSO', 'Pipeline de ingestão Siconfi executa com status SUCESSO');
  assert(syncResult.totalRegistros >= 0, `Sincronização processou registros contábeis oficiais (${syncResult.totalRegistros} registros)`);
  assert(syncResult.codigoIbge === '4101804', 'Código IBGE de Araucária (4101804) mapeado corretamente');

  // =========================================================================
  // 4. Consulta ao histórico de logs
  // =========================================================================
  const logsRes = siconfiController.getLogs('tenant-araucaria');
  assert(logsRes.success && logsRes.logs.length > 0, 'Registro de auditoria SyncLog gravado com sucesso');
  assert(logsRes.logs[0].status === 'SUCESSO', 'Último log de sincronização registrado como SUCESSO');
  assert(logsRes.logs[0].sourceKey === 'SICONFI_DATA_LAKE', 'Origem registrada como SICONFI_DATA_LAKE no log');

  // =========================================================================
  // 5. Teste de Sincronização multi-tenant (Curitiba - IBGE 4106902)
  // =========================================================================
  const curitibaSync = await syncService.syncTenant('tenant-curitiba', 2026);
  assert(curitibaSync.status === 'SUCESSO' && curitibaSync.codigoIbge === '4106902', 'Pipeline multi-tenant sincroniza prefeitura de Curitiba (IBGE 4106902)');

  // =========================================================================
  // 6. Teste de Sincronização de Maringá (IBGE 4115200)
  // =========================================================================
  const maringaSync = await syncService.syncTenant('tenant-maringa', 2026);
  assert(maringaSync.status === 'SUCESSO' && maringaSync.codigoIbge === '4115200', 'Pipeline multi-tenant sincroniza prefeitura de Maringá (IBGE 4115200)');

  // =========================================================================
  // 7. Status e verificação via Controller
  // =========================================================================
  const statusRes: any = await siconfiController.getStatus('tenant-araucaria', '4101804');
  assert(!!statusRes && typeof statusRes.online === 'boolean', 'GET /api/siconfi/status retorna estado de conexão');
  assert(typeof statusRes.latencyMs === 'number', 'GET /api/siconfi/status retorna latência em milissegundos');

  // =========================================================================
  // 8. Cache e Proxy transparente via SiconfiService
  // =========================================================================
  const proxyResult = await siconfiController.queryProxy({ endpoint: 'entes', codigoIbge: '4101804' });
  assert(!!proxyResult, 'GET /api/siconfi/proxy encaminha consulta à API Siconfi ou retorna cache/fallback');

  console.log(`\nResultado da Fase 5: ${passCount}/${totalCount} testes de Siconfi Real e Sincronização passaram com sucesso.`);
}

runSiconfiTests().catch((err) => {
  console.error('Erro fatal no teste do Siconfi (Fase 5):', err.message || err);
  process.exit(1);
});
