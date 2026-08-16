import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../server/app.module';
import { FiscalController } from '../server/fiscal/fiscal.controller';
import { DataProvenanceService } from '../server/fiscal/data-provenance.service';

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
  const provenanceService = moduleRef.get<DataProvenanceService>(DataProvenanceService);
  const fakeReq: any = { query: { tenantId: 'tenant-araucaria', codigoIbge: '4101804' }, headers: {}, tenantId: 'tenant-araucaria' };

  // =========================================================================
  // 1. dataSource no Summary (KPIs)
  // =========================================================================
  const summary: any = fiscalController.getSummary(fakeReq, '2026');
  assert(!!summary.dataSource, 'Summary fiscal inclui objeto dataSource');
  assert(
    summary.dataSource.origin === 'DEMONSTRACAO' || summary.dataSource.origin === 'OFICIAL',
    'Origin do Summary é estritamente OFICIAL ou DEMONSTRACAO',
  );
  assert(!!summary.dataSource.source && summary.dataSource.source.length > 0, 'Metadado contém descrição explícita da fonte');
  assert(
    summary.dataSource.confidence === 'OFICIAL_HOMOLOGADO' ||
    summary.dataSource.confidence === 'ESTIMATIVA_ALTA_CONFIANCA' ||
    summary.dataSource.confidence === 'PROJECAO_PREDITIVA',
    'Nível de confiança do Summary é um dos valores válidos do enum',
  );

  // =========================================================================
  // 2. dataSource nas Receitas
  // =========================================================================
  const receitasRes: any = fiscalController.getReceitas(fakeReq, '2026');
  assert(!!receitasRes.dataSource, 'Receitas orçamentárias incluem metadados de rastreabilidade de dados');
  assert(
    receitasRes.dataSource.origin === 'DEMONSTRACAO',
    'Dados de modelo estatístico/LOA são transparentemente marcados como DEMONSTRACAO',
  );
  assert(!!receitasRes.dataSource.source, 'Receitas contêm descrição da fonte de dados');

  // =========================================================================
  // 3. dataSource nas Despesas
  // =========================================================================
  const despesasRes: any = fiscalController.getDespesas(fakeReq, '2026');
  assert(!!despesasRes.dataSource, 'Despesas por natureza e função incluem metadado dataSource');
  assert(!!despesasRes.dataSource.origin, 'Despesas contêm campo origin no dataSource');

  // =========================================================================
  // 4. dataSource nos Limites LRF
  // =========================================================================
  const limitesRes: any = fiscalController.getLimites(fakeReq, '2026');
  assert(!!limitesRes.dataSource, 'Limites fiscais da LRF incluem metadado dataSource');
  assert(!!limitesRes.dataSource.source, 'Limites LRF contêm descrição da fonte de dados');

  // =========================================================================
  // 5. DataProvenanceService — injeção e método buildMetadata
  // =========================================================================
  assert(!!provenanceService, 'DataProvenanceService injetado com sucesso no container NestJS');

  const metaOficial = provenanceService.buildMetadata({
    provider: 'SICONFI',
    isConnected: true,
    collectedAt: '01/08/2026',
    anexo: 'RREO',
  });
  assert(metaOficial.origin === 'OFICIAL', 'buildMetadata com isConnected=true retorna origin OFICIAL');
  assert(metaOficial.confidence === 'OFICIAL_HOMOLOGADO', 'buildMetadata OFICIAL tem confidence OFICIAL_HOMOLOGADO');
  assert(metaOficial.source.includes('SICONFI'), 'buildMetadata SICONFI inclui SICONFI na descrição da fonte');
  assert(metaOficial.anexo === 'RREO', 'buildMetadata preserva campo anexo');

  const metaDemo = provenanceService.buildMetadata({
    provider: 'SICONFI',
    isConnected: false,
  });
  assert(metaDemo.origin === 'DEMONSTRACAO', 'buildMetadata com isConnected=false retorna origin DEMONSTRACAO');
  assert(metaDemo.confidence === 'ESTIMATIVA_ALTA_CONFIANCA', 'buildMetadata demo tem confidence ESTIMATIVA_ALTA_CONFIANCA');

  // =========================================================================
  // 6. getSourcesStatus — lista todas as fontes de dados
  // =========================================================================
  const sourcesStatus = await provenanceService.getSourcesStatus('tenant-araucaria');
  assert(Array.isArray(sourcesStatus) && sourcesStatus.length >= 4, 'getSourcesStatus retorna array com pelo menos 4 fontes de dados');

  const siconfiSource = sourcesStatus.find(s => s.provider === 'SICONFI');
  assert(!!siconfiSource, 'SICONFI presente no catálogo de fontes de dados');
  assert(siconfiSource!.origin === 'OFICIAL' || siconfiSource!.origin === 'DEMONSTRACAO', 'SICONFI tem origin válido');
  assert(!!siconfiSource!.label && siconfiSource!.label.length > 0, 'SICONFI tem label descritivo');
  assert(!!siconfiSource!.url, 'SICONFI tem URL da fonte original');

  const modeloSource = sourcesStatus.find(s => s.provider === 'MODELO_PREDITIVO');
  assert(!!modeloSource, 'Motor Preditivo presente no catálogo de fontes');
  assert(modeloSource!.origin === 'DEMONSTRACAO', 'Motor Preditivo é sempre marcado como DEMONSTRACAO');

  // =========================================================================
  // 7. Proveniência — endpoint REST
  // =========================================================================
  const provResult: any = await fiscalController.getProveniencia(fakeReq);
  assert(provResult.success === true, 'GET /api/fiscal/proveniencia retorna sucesso');
  assert(Array.isArray(provResult.sources), 'Proveniência retorna array de fontes de dados');
  assert(provResult.sources.length >= 4, 'Proveniência lista pelo menos 4 provedores de dados');
  assert(!!provResult.tenantId, 'Proveniência inclui tenantId no payload de resposta');

  // =========================================================================
  // 8. Histórico de sincronizações
  // =========================================================================
  const histResult: any = await fiscalController.getProvenienciaHistorico(fakeReq, '10');
  assert(histResult.success === true, 'GET /api/fiscal/proveniencia/historico retorna sucesso');
  assert(Array.isArray(histResult.logs), 'Histórico de sincronizações retorna array de logs');

  // =========================================================================
  // 9. recordSync — persiste no banco
  // =========================================================================
  await provenanceService.recordSync({
    tenantId: 'tenant-araucaria',
    provider: 'SICONFI',
    status: 'success',
    recordsIngested: 142,
    metadata: { exercicio: 2026, periodo: 6, periodicidade: 'M' },
  });
  assert(true, 'recordSync executa sem lançar exceção (banco online ou fallback silencioso)');

  // Verifica se o log foi persistido (quando banco disponível)
  const logsApos = await provenanceService.getSyncHistory('tenant-araucaria', 5);
  assert(Array.isArray(logsApos), 'getSyncHistory retorna array de logs após recordSync');

  console.log(`\nResultado da Fase 4: ${passCount}/${totalCount} testes de DataSourceBadge e transparência passaram com sucesso.`);
}

runDataSourceBadgeTests().catch((err) => {
  console.error('Erro fatal no teste de DataSourceBadge (Fase 4):', err.message || err);
  process.exit(1);
});
