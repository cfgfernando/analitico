import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runSimuladorReformaTests() {
  console.log('--- [TESTE DE SIMULADOR DE REFORMA TRIBUTÁRIA FASE 8: NESTJS] ---');
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

  // 1. Consulta ao endpoint de simulação da reforma tributária
  const simuladorRes: any = fiscalController.getSimuladorReforma(fakeReq);
  assert(!!simuladorRes && Array.isArray(simuladorRes.projecoes), 'GET /api/fiscal/simulador-reforma retorna payload');
  assert(simuladorRes.projecoes.length === 8, 'Curva de transição modelada para os 8 anos (2026 a 2033)');

  // 2. Validação das fases e anos da Reforma (EC 132/2023)
  const proj2026 = simuladorRes.projecoes[0];
  const proj2033 = simuladorRes.projecoes[7];
  assert(proj2026.ano === 2026 && proj2026.ibsProjetado === 0, '2026 modelado como início com alíquota teste 0,1%');
  assert(proj2033.ano === 2033 && proj2033.icmsSemReforma > 0 && proj2033.ibsProjetado > 0, '2033 modelado com extinção do ICMS e plena vigência do IBS no destino');

  // 3. Validação do Fundo de Compensação de Perdas da EC 132
  const anosComCompensacao = simuladorRes.projecoes.filter((p: any) => p.fundoCompensacaoFederativo > 0);
  assert(anosComCompensacao.length > 0, 'Fundo de Compensação Federativo ativado para amortecer transição para o IBS');

  // 4. Validação do Plano de Medidas Compensatórias
  assert(
    Array.isArray(simuladorRes.medidasCompensatorias) && simuladorRes.medidasCompensatorias.length >= 4,
    'Plano de Ação Estratégico gerado com medidas de IPTU, ISS, CIP e Dívida Ativa'
  );
  assert(
    simuladorRes.medidasCompensatorias[0].impactoAnualEstimado > 0 &&
    !!simuladorRes.medidasCompensatorias[0].acaoPratica,
    'Medidas contêm impacto financeiro anual estimado em R$ e ação prática de execução'
  );

  // 5. Teste do ajuste de esforço de arrecadação própria
  const ajusteRes: any = fiscalController.ajustarSimulacaoReforma(fakeReq, {
    variacaoArrecadacaoPropriaPct: 5.0,
  });
  assert(!!ajusteRes && ajusteRes.projecoes[7].receitaTotalComReforma > proj2033.receitaTotalComReforma, 'POST /api/fiscal/simulador-reforma/ajustar recalcula receitas com ganho próprio');

  console.log(`\nResultado da Fase 8: ${passCount}/${totalCount} testes de Simulador de Reforma passaram com sucesso.`);
}

runSimuladorReformaTests().catch((err) => {
  console.error('Erro fatal no teste da Reforma Tributária:', err);
  process.exit(1);
});
