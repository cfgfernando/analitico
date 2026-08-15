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

  // 5. Validação de Destaques e Oportunidades
  assert(
    Array.isArray(benchRes.destaques.pontosFortes) && benchRes.destaques.pontosFortes.length > 0,
    'Pontos fortes e vantagens competitivas do município identificadas'
  );
  assert(
    Array.isArray(benchRes.destaques.oportunidadesMelhoria) && benchRes.destaques.oportunidadesMelhoria.length > 0,
    'Oportunidades de melhoria e alertas de gestão fiscal gerados'
  );

  console.log(`\nResultado da Fase 9: ${passCount}/${totalCount} testes de Benchmark Municipal passaram com sucesso.`);
}

runBenchmarkTests().catch((err) => {
  console.error('Erro fatal no teste de Benchmark:', err);
  process.exit(1);
});
