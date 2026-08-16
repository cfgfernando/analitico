import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runAlertasProativosTests() {
  console.log('--- [TESTE DE ALERTAS PROATIVOS E PARAMETRIZAÇÃO LEGAIS FASE 11: NESTJS] ---');
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

  // 1. Consulta ao endpoint de Alertas Proativos
  const alertasRes: any = fiscalController.getAlertasProativos(fakeReq);
  assert(!!alertasRes && Array.isArray(alertasRes.alertas), 'GET /api/fiscal/alertas-proativos retorna lista de alertas');
  assert(alertasRes.totalAlertas >= 8, 'Monitoramento ativo de no mínimo 8 obrigações, contratos e riscos legais');

  // 2. Contadores de Severidade
  assert(alertasRes.totalCriticos >= 2, 'Total de alertas críticos apurado com no mínimo 2 urgências');
  assert(alertasRes.totalAtencao >= 3, 'Total de alertas em atenção apurado com no mínimo 3 itens');

  // 3. Validação dos Prazos e Riscos Auditados
  const categoriasEsperadas = ['CAUC', 'SICONFI', 'LRF_PESSOAL', 'ORCAMENTO', 'CONVENIOS', 'FUNDEB', 'CONTRATOS', 'RECEITAS'];
  const categoriasEncontradas = alertasRes.alertas.map((a: any) => a.categoria);
  for (const cat of categoriasEsperadas) {
    assert(categoriasEncontradas.includes(cat), `Monitoramento ativo de categoria regulatória: ${cat}`);
  }

  // 4. Validação de Alertas Específicos do PNCP (Lei 14.133)
  const alertasContratos = alertasRes.alertas.filter((a: any) => a.categoria === 'CONTRATOS');
  assert(alertasContratos.length >= 2, 'Alertas de contratos PNCP (SAMU e Limpeza) gerados');
  const alertSamu = alertasContratos.find((a: any) => a.id === 'alt-pncp-samu');
  assert(alertSamu && alertSamu.severidade === 'CRITICO', 'Alerta de ambulâncias do SAMU classificado como CRÍTICO');

  // 5. Validação Estrutural de Cada Alerta
  for (const alerta of alertasRes.alertas) {
    assert(
      ['CRITICO', 'ALERTA', 'INFORMATIVO'].includes(alerta.severidade),
      `Alerta '${alerta.titulo}' possui nível de severidade válido`
    );
    assert(
      typeof alerta.diasRestantes === 'number' && alerta.diasRestantes > 0,
      `Alerta '${alerta.titulo}' possui contagem regressiva em dias (${alerta.diasRestantes} dias)`
    );
    assert(!!alerta.sancaoPrevista, `Alerta '${alerta.titulo}' especifica a sanção legal`);
    assert(!!alerta.acaoRecomendada, `Alerta '${alerta.titulo}' orienta a ação corretiva imediata`);
  }

  // 6. Testes do Endpoint de Parametrização de Alarmes e Regras Legais / Boas Práticas
  const paramsRes: any = fiscalController.getParametrosAlertas(fakeReq);
  assert(!!paramsRes && Array.isArray(paramsRes.regras), 'GET /api/fiscal/alertas-proativos/parametros retorna catálogo de regras');
  assert(paramsRes.regras.length >= 7, 'Catálogo contempla no mínimo 7 regras parametrizáveis por leis e boas práticas');

  // Validação de regras fundamentais
  const regraPncp = paramsRes.regras.find((r: any) => r.id === 'param-pncp-servicos-continuos');
  assert(!!regraPncp, 'Regra de contratos PNCP parametrizada');
  assert(regraPncp.fundamentacaoLegal.includes('14.133'), 'Regra PNCP fundamentada na Lei 14.133');
  assert(regraPncp.prazoBoaPraticaSugerido.includes('90 a 120 dias'), 'Regra PNCP inclui recomendação de boa prática do TCU (90-120 dias)');

  const regraLrf = paramsRes.regras.find((r: any) => r.id === 'param-lrf-folha-pessoal');
  assert(!!regraLrf, 'Regra da LRF de folha parametrizada');
  assert(regraLrf.prazoLei.includes('51,30%') && regraLrf.prazoLei.includes('54,00%'), 'Regra LRF especifica limites legais de alerta, prudencial e máximo');

  const regraCauc = paramsRes.regras.find((r: any) => r.id === 'param-cauc-certidoes');
  assert(!!regraCauc && regraCauc.diasGatilhoAlertaCritico === 15, 'Regra CAUC com gatilho crítico oficial de 15 dias');

  // 7. Validação dos 4 Entregáveis da Fase 12 (Alertas de Prazos Críticos: FUNDEB / SIOPE / MSC)
  // 7.1 Checklist Mensal do FUNDEB
  assert(
    Array.isArray(alertasRes.checklistFundeb) && alertasRes.checklistFundeb.length >= 5,
    'Entregável 1: Checklist periódico do FUNDEB com no mínimo 5 obrigações regulatórias monitoradas'
  );
  const chkMsc = alertasRes.checklistFundeb.find((c: any) => c.obrigacao.includes('MSC'));
  assert(
    !!chkMsc && chkMsc.diasRestantes === 5 && chkMsc.status === 'URGENTE',
    'Entregável 1: Alerta da MSC (Siconfi) ativo com contagem de 5 dias restantes'
  );

  // 7.2 Alerta Crítico com Contagem Regressiva e Impacto VAAT
  const alertaMsc = alertasRes.alertas.find((a: any) => a.id === 'alt-msc-vaat');
  assert(
    !!alertaMsc && alertaMsc.diasRestantes === 5 && alertaMsc.severidade === 'CRITICO',
    'Entregável 2: Alerta com contagem regressiva gerado: "Envio da MSC vence em 5 dias"'
  );
  assert(
    alertaMsc.descricao.includes('VAAT') && alertaMsc.descricao.includes('10,5% do FUNDEB'),
    'Entregável 2: Mensagem executiva alerta explicitamente o risco de perda do VAAT (10,5% do FUNDEB)'
  );

  // 7.3 Mapa de Risco da VAAT & VAAR
  assert(
    !!alertasRes.mapaRiscoVaat && Array.isArray(alertasRes.mapaRiscoVaat.requisitos),
    'Entregável 3: Mapa de risco da VAAT com status de requisitos de habilitação presente'
  );
  assert(
    alertasRes.mapaRiscoVaat.percentualComplementacaoVaat === 10.5 && alertasRes.mapaRiscoVaat.valorEstimadoEmRisco > 0,
    'Entregável 3: Valor estimado de recursos em risco do VAAT apurado'
  );

  // 7.4 Proveniência e Dados Oficiais
  assert(!!alertasRes.dataSource && alertasRes.dataSource.origin === 'OFICIAL', 'Entregável 4: Metadado dataSource OFICIAL anexado');

  console.log(`\nResultado da Fase 12 (Alertas FUNDEB/SIOPE/MSC): ${passCount}/${totalCount} testes passaram com 100% de sucesso.`);
}

runAlertasProativosTests().catch((err) => {
  console.error('Erro fatal no teste de Alertas Proativos e Parametrização:', err.message || err);
  process.exit(1);
});
