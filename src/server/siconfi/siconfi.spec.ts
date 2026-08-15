import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { SiconfiSyncService } from './siconfi-sync.service';
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
  const siconfiController = moduleRef.get<SiconfiController>(SiconfiController);

  // 1. Instanciação e injeção do serviço
  assert(!!syncService, 'SiconfiSyncService injetado com sucesso no container NestJS');

  // 2. Health check da API Siconfi / Tesouro Nacional
  const health = await SiconfiClient.checkHealth();
  assert(typeof health.online === 'boolean' && health.latencyMs >= 0, 'SiconfiClient reporta conectividade e latência');

  // 3. Execução do pipeline de sincronização contábil (Araucária)
  const syncResult = await syncService.syncTenant('tenant-araucaria', 2026);
  assert(syncResult.status === 'SUCESSO', 'Pipeline de ingestão Siconfi executa com status SUCESSO');
  assert(syncResult.totalRegistros > 0, `Sincronização persistiu registros contábeis oficiais (${syncResult.totalRegistros} registros)`);
  assert(syncResult.anexosProcessados.length > 0, 'Demonstrativos fiscais (RREO/RGF) processados');

  // 4. Consulta ao histórico de logs
  const logsRes = siconfiController.getLogs('tenant-araucaria');
  assert(logsRes.success && logsRes.logs.length > 0, 'Registro de auditoria SyncLog gravado com sucesso');
  assert(logsRes.logs[0].status === 'SUCESSO', 'Último log de sincronização registrado como SUCESSO');

  // 5. Teste de Sincronização de outro município (Curitiba)
  const curitibaSync = await syncService.syncTenant('tenant-curitiba', 2026);
  assert(curitibaSync.status === 'SUCESSO' && curitibaSync.codigoIbge === '4106902', 'Pipeline multi-tenant sincroniza prefeitura de Curitiba (IBGE 4106902)');

  console.log(`\nResultado da Fase 5: ${passCount}/${totalCount} testes de Siconfi Real e Sincronização passaram com sucesso.`);
}

runSiconfiTests().catch((err) => {
  console.error('Erro fatal no teste do Siconfi:', err);
  process.exit(1);
});
