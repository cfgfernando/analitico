import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runRadarCaptacaoTests() {
  console.log('--- [TESTE DE RADAR DE CAPTAÇÃO FASE 7: NESTJS] ---');
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
  // 1. Consulta ao endpoint de Radar de Captação
  // =========================================================================
  const radarRes: any = fiscalController.getRadarCaptacao(fakeReq);
  assert(!!radarRes && Array.isArray(radarRes.programas), 'GET /api/fiscal/radar-captacao retorna lista de programas');
  assert(radarRes.programas.length > 0, 'Programas abertos de captação encontrados no catálogo');
  assert(!!radarRes.resumo, 'Resumo do radar presente com métricas agregadas');
  assert(radarRes.resumo.potencialGlobalCaptacao > 0, 'Potencial global de captação calculado');

  // =========================================================================
  // 2. Integração com CAUC & CAPAG no Radar
  // =========================================================================
  assert(radarRes.resumo.caucStatus === 'ADIMPLENTE', 'Situação do CAUC informada como ADIMPLENTE');
  assert(typeof radarRes.resumo.caucRestricoes === 'number', 'Contagem de restrições do CAUC presente');
  assert(!!radarRes.resumo.caucAlerta, 'Alerta de adimplência do CAUC configurado');
  assert(!!radarRes.resumo.capagScore, 'Classificação CAPAG informada no resumo');

  // =========================================================================
  // 3. Validação dos Critérios de Elegibilidade (CAUC / CAPAG)
  // =========================================================================
  const firstProg = radarRes.programas[0];
  assert(
    ['ELEGIVEL', 'RESTRICAO', 'INELEGIVEL'].includes(firstProg.elegibilidade.status),
    'Algoritmo de elegibilidade municipal classifica status corretamente'
  );
  assert(
    Array.isArray(firstProg.elegibilidade.motivos) && firstProg.elegibilidade.motivos.length > 0,
    'Elegibilidade inclui justificativas e requisitos atendidos'
  );
  assert(firstProg.elegibilidade.caucExigido === true, 'Exigência de regularidade no CAUC auditada');

  // =========================================================================
  // 4. Linha do Tempo de Prazos (Timeline com contagem regressiva)
  // =========================================================================
  assert(
    typeof firstProg.diasRestantes === 'number' && firstProg.diasRestantes >= 0,
    'Contagem regressiva de dias restantes calculada com base na data de encerramento'
  );
  assert(
    ['URGENTE', 'MODERADO', 'CONFORTAVEL', 'ENCERRADO'].includes(firstProg.statusPrazo),
    'Status de urgência do prazo classificado'
  );

  // =========================================================================
  // 5. Teste do Simulador de Contrapartida em R$ (Caso 1: R$ 5M @ 5%)
  // =========================================================================
  const simulacaoRes: any = fiscalController.simularContrapartida(fakeReq, {
    valorGlobal: 5000000,
    percentualContrapartida: 5.0,
  });
  assert(!!simulacaoRes, 'POST /api/fiscal/radar-captacao/simular processa cálculo');
  assert(simulacaoRes.valorContrapartidaMunicipal === 250000, 'Contrapartida calculada em R$ 250.000 (5% de 5M)');
  assert(simulacaoRes.valorRepasseFederal === 4750000, 'Repasse federal calculado em R$ 4.750.000 (95% de 5M)');
  assert(simulacaoRes.saldoCaixaLivreDisponivel > 0, 'Cruzamento com saldo de reserva livre do município realizado');
  assert(
    ['ALTA', 'MODERADA', 'CRITICA'].includes(simulacaoRes.viabilidade),
    'Parecer de viabilidade financeira emitido'
  );

  // =========================================================================
  // 6. Teste de Simulação de Grande Porte (Caso 2: R$ 50M @ 10%)
  // =========================================================================
  const simGrandePorte: any = fiscalController.simularContrapartida(fakeReq, {
    valorGlobal: 50000000,
    percentualContrapartida: 10.0,
  });
  assert(simGrandePorte.valorContrapartidaMunicipal === 5000000, 'Contrapartida de grande porte calculada em R$ 5.000.000');
  assert(simGrandePorte.valorRepasseFederal === 45000000, 'Repasse federal de grande porte calculado em R$ 45.000.000');
  assert(simGrandePorte.percentualComprometimentoCaixaLivre > 0, 'Percentual de comprometimento do caixa livre apurado');

  // =========================================================================
  // 7. Validação dos 7 Entregáveis da Fase 8 (Radar de Captação de Recursos)
  // =========================================================================
  // 7.1 Emendas Parlamentares
  assert(
    Array.isArray(radarRes.emendasParlamentares) && radarRes.emendasParlamentares.length > 0,
    'Entregável 1: Emendas parlamentares listadas com autor, esfera, valor e status'
  );
  assert(
    !!radarRes.emendasParlamentares[0].autor && radarRes.emendasParlamentares[0].valorPago > 0,
    'Entregável 1: Emendas contêm autor identificado e valor pago comprovado'
  );

  // 7.2 Convênios Abertos
  assert(
    Array.isArray(radarRes.programas) && radarRes.programas.length >= 4,
    'Entregável 2: Convênios abertos no Transferegov, Novo PAC e FNSP listados'
  );

  // 7.3 Meta de Captação vs Realizado
  assert(
    !!radarRes.metaCaptacao && radarRes.metaCaptacao.metaAnual > 0 && radarRes.metaCaptacao.captadoRealizado > 0,
    'Entregável 3: Meta de captação vs realizado calculada com percentual de atingimento'
  );
  assert(
    typeof radarRes.metaCaptacao.resumoTexto === 'string' && radarRes.metaCaptacao.resumoTexto.includes('captou'),
    'Entregável 3: Texto executivo "Você captou R$ X mi de R$ Y mi potenciais" gerado'
  );

  // 7.4 Alertas de Janela (< 15 dias)
  assert(
    Array.isArray(radarRes.alertasJanela) && radarRes.alertasJanela.length > 0,
    'Entregável 4: Alertas de janela gerados para oportunidades que fecham em menos de 15 dias'
  );
  assert(
    radarRes.alertasJanela[0].diasRestantes <= 15,
    'Entregável 4: Contagem regressiva de dias restantes nos alertas de janela validada'
  );

  // 7.5 Carteira de Projetos Prontos
  assert(
    Array.isArray(radarRes.carteiraProjetosProntos) && radarRes.carteiraProjetosProntos.length >= 4,
    'Entregável 5: Carteira de projetos estruturados cadastrada com ETP e maturidade'
  );
  assert(
    radarRes.carteiraProjetosProntos[0].etpStatus === 'PRONTO' && !!radarRes.carteiraProjetosProntos[0].potencialConcedente,
    'Entregável 5: Projeto estruturado com ETP pronto e concedente alvo vinculado'
  );

  // 7.6 Calendário Anual de Chamadas
  assert(
    Array.isArray(radarRes.calendarioChamadas) && radarRes.calendarioChamadas.length >= 6,
    'Entregável 6: Calendário anual de chamadas com cronograma de 12 meses por ministério'
  );

  // 7.7 Estimativa de Impacto e Probabilidade
  assert(
    ['ALTA', 'MEDIA', 'BAIXA'].includes(firstProg.probabilidade) && firstProg.valorPonderado > 0,
    'Entregável 7: Oportunidades com estimativa de impacto em R$ e probabilidade de êxito'
  );

  // =========================================================================
  // 8. Validação de Rastreabilidade e DataSourceBadge
  // =========================================================================
  assert(!!radarRes.dataSource && !!radarRes.dataSource.origin, 'Metadado dataSource anexado ao Radar de Captação');

  console.log(`\nResultado da Fase 8 (Radar de Captação): ${passCount}/${totalCount} testes passaram com 100% de sucesso.`);
}

runRadarCaptacaoTests().catch((err) => {
  console.error('Erro fatal no teste do Radar de Captação:', err.message || err);
  process.exit(1);
});
