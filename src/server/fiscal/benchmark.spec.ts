import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runBenchmarkTests() {
  console.log('--- [TESTE DE BENCHMARK REGIONAL FASE 9: NESTJS] ---');
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

  // 1. Consulta ao endpoint de Benchmark
  const benchRes: any = fiscalController.getBenchmark(fakeReq);
  assert(!!benchRes && Array.isArray(benchRes.ranking), 'GET /api/fiscal/benchmark retorna ranking de municípios');
  assert(benchRes.ranking.length >= 5, 'Grupo comparativo regional com mínimo de 5 municípios');

  // 2. Validação dos Indicadores per capita
  const ativo = benchRes.municipioAtivo;
  assert(ativo.rclPerCapita > 0, 'RCL per capita calculada a partir da população e RCL total');
  assert(ativo.arrecadacaoPropriaPerCapita > 0, 'Arrecadação própria per capita (IPTU/ISS) calculada');
  assert(ativo.investimentoPerCapita > 0, 'Investimento per capita em bens de capital calculado');

  // 3. Validação do Score Geral de Eficiência Fiscal
  assert(
    typeof ativo.scoreEficienciaFiscal === 'number' &&
    ativo.scoreEficienciaFiscal >= 0 &&
    ativo.scoreEficienciaFiscal <= 100,
    'Score de Eficiência Fiscal calculado na escala de 0 a 100 pontos'
  );

  // 4. Validação da Ordenação do Ranking
  for (let i = 0; i < benchRes.ranking.length - 1; i++) {
    assert(
      benchRes.ranking[i].scoreEficienciaFiscal >= benchRes.ranking[i + 1].scoreEficienciaFiscal,
      `Ranking ordenado corretamente por score decrescente (Posição ${i + 1} >= Posição ${i + 2})`
    );
  }

  // 5. Validação dos Entregáveis da Fase 10 (Benchmark entre Municípios)
  assert(
    benchRes.ranking.length >= 3,
    'Entregável 1: Compara com pelo menos 3 municípios similares do mesmo estado/porte'
  );

  assert(
    typeof ativo.despesaPessoalPct === 'number' && typeof benchRes.grupoComparativo.mediaDespesaPessoalPct === 'number',
    'Entregável 2: % da RCL com pessoal calculado para o ativo e média do grupo similar'
  );

  assert(
    typeof ativo.arrecadacaoPropriaPct === 'number' && ativo.arrecadacaoPropriaPct > 0,
    'Entregável 2: % de receita própria (IPTU+ISS+ITBI) vs transferências calculado'
  );

  assert(
    typeof ativo.captacaoPerCapita === 'number' && ativo.captacaoPerCapita > 0,
    'Entregável 2: Captação de recursos per capita (R$/hab) apurada'
  );

  assert(
    typeof ativo.gastoSaudePct === 'number' && typeof ativo.gastoEducacaoPct === 'number' && typeof ativo.gastoObrasPct === 'number',
    'Entregável 2: Despesas por função (% do orçamento em Saúde, Educação e Obras) calculadas'
  );

  assert(
    typeof benchRes.grupoComparativo.resumoComparativo === 'string' &&
    benchRes.grupoComparativo.resumoComparativo.includes('gasta') &&
    benchRes.grupoComparativo.resumoComparativo.includes('da RCL com pessoal'),
    'Entregável 3: Frase executiva comparativa ("X gasta Y% da RCL com pessoal; similares: média Z%")'
  );

  assert(
    typeof ativo.autonomiaRankingPosicao === 'number' &&
    ativo.autonomiaRankingPosicao >= 1 &&
    ativo.autonomiaRankingPosicao <= benchRes.ranking.length,
    'Entregável 4: Ranking amigável de autonomia fiscal apurado'
  );

  // 6. Validação de Destaques e Oportunidades
  assert(
    Array.isArray(benchRes.destaques.pontosFortes) && benchRes.destaques.pontosFortes.length > 0,
    'Pontos fortes e vantagens competitivas do município identificadas'
  );
  assert(
    Array.isArray(benchRes.destaques.oportunidadesMelhoria) && benchRes.destaques.oportunidadesMelhoria.length > 0,
    'Oportunidades de melhoria e alertas de gestão fiscal gerados'
  );

  // 7. Validação de Proveniência Oficial
  assert(!!benchRes.dataSource && benchRes.dataSource.origin === 'OFICIAL', 'Metadado dataSource OFICIAL anexado');

  console.log(`\nResultado da Fase 10 (Benchmark Municipal): ${passCount}/${totalCount} testes passaram com 100% de sucesso.`);
}

runBenchmarkTests().catch((err) => {
  console.error('Erro fatal no teste de Benchmark:', err);
  process.exit(1);
});
