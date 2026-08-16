import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runSimuladorCenariosTests() {
  console.log('--- [TESTE DE SIMULADOR DE CENÁRIOS LOA "E SE" FASE 9: NESTJS] ---');
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

  // =========================================================================
  // 1. Consulta ao Cenário Base LOA
  // =========================================================================
  const baseRes: any = fiscalController.getSimuladorCenarios(fakeReq);
  assert(!!baseRes && !!baseRes.cenarioBase, 'GET /api/fiscal/simulador-cenarios retorna Cenário Base');
  assert(baseRes.cenarioBase.receitaTotal > 0, 'Receita total do cenário base calculada');
  assert(baseRes.cenarioBase.rcl > 0, 'Receita Corrente Líquida (RCL) do cenário base informada');
  assert(baseRes.cenarioBase.folhaPercentualRCL > 0, 'Percentual da folha sobre a RCL informado no cenário base');
  assert(!!baseRes.sinteseHumana, 'Síntese executiva em linguagem humana presente no cenário base');

  // =========================================================================
  // 2. Simulação: Aumentar ISS em 15%
  // =========================================================================
  const simIssRes: any = fiscalController.simularCenariosLoa(fakeReq, {
    variacaoIssPct: 15.0,
  });
  assert(!!simIssRes, 'POST /api/fiscal/simulador-cenarios/simular processa com sucesso');
  assert(simIssRes.cenarioSimulado.iss > baseRes.cenarioBase.iss, 'ISS simulado maior que o ISS base (+15%)');
  assert(simIssRes.impactos.deltaIss === Math.round(baseRes.cenarioBase.iss * 0.15), 'Delta nominal do ISS calculado com exatidão');
  assert(simIssRes.cenarioSimulado.rcl > baseRes.cenarioBase.rcl, 'Aumento do ISS expande a RCL do município');
  assert(simIssRes.cenarioSimulado.folhaPercentualRCL < baseRes.cenarioBase.folhaPercentualRCL, 'Percentual da folha sobre a RCL reduz devido ao aumento da receita');

  // =========================================================================
  // 3. Simulação: Recadastrar Imóveis (PGV Atualizada +20%)
  // =========================================================================
  const simPgvRes: any = fiscalController.simularCenariosLoa(fakeReq, {
    recadastramentoPgvPct: 20.0,
  });
  assert(simPgvRes.cenarioSimulado.iptu > baseRes.cenarioBase.iptu, 'IPTU simulado reflete ganho de 20% com atualização da PGV');
  assert(simPgvRes.impactos.deltaIptu === Math.round(baseRes.cenarioBase.iptu * 0.20), 'Impacto nominal da PGV apurado em R$/ano');

  // =========================================================================
  // 4. Simulação: Cortar Custeio em 10%
  // =========================================================================
  const simCusteioRes: any = fiscalController.simularCenariosLoa(fakeReq, {
    corteCusteioPct: -10.0,
  });
  assert(simCusteioRes.cenarioSimulado.despesaCusteio < baseRes.cenarioBase.despesaCusteio, 'Despesa de custeio reduzida em 10%');
  assert(simCusteioRes.impactos.economiaCusteio > 0, 'Economia de custeio apurada positivamente');
  assert(simCusteioRes.cenarioSimulado.saldoPrimario > 0, 'Corte de custeio gera superávit primário simulado');

  // =========================================================================
  // 5. Simulação Combinada de Decisão Estratégica (ISS +10%, PGV +15%, Custeio -5%, ITBI +8%)
  // =========================================================================
  const simCombinada: any = fiscalController.simularCenariosLoa(fakeReq, {
    variacaoIssPct: 10.0,
    recadastramentoPgvPct: 15.0,
    corteCusteioPct: -5.0,
    variacaoItbiPct: 8.0,
  });
  assert(simCombinada.impactos.impactoLiquidoAnual > 0, 'Impacto financeiro líquido anual positivo na combinação de medidas');
  assert(simCombinada.impactos.ganhoFolgaPrudencialReais > 0, 'Ganho de folga prudencial em R$ comprovado na simulação');
  assert(
    simCombinada.sinteseHumana.includes('sua folha cairia de') && simCombinada.sinteseHumana.includes('% da RCL'),
    'Mensagem em linguagem humana gerada: "sua folha cairia de X% para Y% da RCL"'
  );
  assert(simCombinada.parecerTecnico.viabilidade === 'FAVORAVEL', 'Parecer técnico emitido como FAVORÁVEL');

  // =========================================================================
  // 6. Teste de Desempenho e Latência (< 2 segundos)
  // =========================================================================
  const startTime = Date.now();
  for (let i = 0; i < 50; i++) {
    fiscalController.simularCenariosLoa(fakeReq, { variacaoIssPct: 5, corteCusteioPct: -2 });
  }
  const totalDurationMs = Date.now() - startTime;
  assert(totalDurationMs < 500, `50 simulações executadas em ${totalDurationMs}ms (média ${totalDurationMs / 50}ms < 2000ms)`);

  // =========================================================================
  // 7. Validação de Rastreabilidade e DataSource
  // =========================================================================
  assert(!!simCombinada.dataSource && simCombinada.dataSource.origin === 'OFICIAL', 'DataSource anexado com proveniência');

  console.log(`\nResultado da Fase 9 (Simulador de Cenários LOA): ${passCount}/${totalCount} testes passaram com 100% de sucesso.`);
}

runSimuladorCenariosTests().catch((err) => {
  console.error('Erro fatal no teste do Simulador de Cenários:', err.message || err);
  process.exit(1);
});
