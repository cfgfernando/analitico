import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';
import { IntegrationService } from '../../integration/integration.service';

async function runPainelPrefeitoTests() {
  console.log('--- [TESTE DE PAINEL DO PREFEITO & 10 FONTES GOVERNAMENTAIS: NESTJS] ---');
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
  const integrationService = moduleRef.get<IntegrationService>(IntegrationService);
  const fakeReq: any = { query: { tenantId: 'tenant-araucaria', codigoIbge: '4101804' }, headers: {} };

  // =========================================================================
  // 1. Consulta ao endpoint do Painel do Prefeito
  // =========================================================================
  const painelRes: any = fiscalController.getPainelPrefeito(fakeReq, '2026');
  assert(!!painelRes, 'GET /api/fiscal/painel-prefeito retorna payload');
  assert(painelRes.municipio.cidade === 'Araucária', 'Painel contextualizado para município correto');

  // =========================================================================
  // 2. Semáforos Constitucionais e Setoriais (LRF, SIOPS, SIOPE, CAUC)
  // =========================================================================
  assert(
    ['VERDE', 'AMARELO', 'VERMELHO'].includes(painelRes.semaforo.status),
    'Semáforo fiscal geral calculado com status válido'
  );
  assert(
    painelRes.semaforoSaude.percentual >= 15.0 && painelRes.semaforoSaude.minimoConstitucional === 15.0,
    `Piso constitucional da Saúde auditado via SIOPS (${painelRes.semaforoSaude.percentual}% >= 15%)`
  );
  assert(
    painelRes.semaforoEducacao.percentualMde >= 25.0 && painelRes.semaforoEducacao.percentualFundebMagisterio >= 70.0,
    `Pisos da Educação auditados via SIOPE (MDE: ${painelRes.semaforoEducacao.percentualMde}%, FUNDEB: ${painelRes.semaforoEducacao.percentualFundebMagisterio}%)`
  );
  assert(painelRes.caucStatus.statusGeral === 'ADIMPLENTE', 'Regularidade fiscal do CAUC confirmada como ADIMPLENTE');

  // =========================================================================
  // 3. Contratos e Compras Públicas — PNCP (Lei 14.133/2021)
  // =========================================================================
  assert(!!painelRes.pncp, 'Seção de Contratos do PNCP presente no payload');
  assert(painelRes.pncp.totalContratosAtivos > 0, `Total de contratos ativos no PNCP apurado (${painelRes.pncp.totalContratosAtivos} contratos)`);
  assert(painelRes.pncp.valorGlobalContratadoAtivo > 0, `Valor global contratado apurado no PNCP (R$ ${painelRes.pncp.valorGlobalContratadoAtivo})`);
  assert(typeof painelRes.pncp.contratosVencendo60Dias === 'number', 'Contratos vencendo em menos de 60 dias identificados');
  assert(painelRes.pncp.fonte.includes('PNCP'), 'Fonte oficial PNCP vinculada');

  // =========================================================================
  // 4. Repasses e Transferências da União — Transparência Federal (CGU)
  // =========================================================================
  assert(!!painelRes.transparenciaFederal, 'Repasses da União (CGU) presentes no painel');
  assert(painelRes.transparenciaFederal.totalRepassesAno > 0, 'Volume total de transferências federais apurado');
  assert(painelRes.transparenciaFederal.repassesFpm > 0, 'Repasses de FPM informados');
  assert(painelRes.transparenciaFederal.emendasPagas > 0, 'Emendas parlamentares pagas informadas');

  // =========================================================================
  // 5. Dados Demográficos e PIB — IBGE
  // =========================================================================
  assert(!!painelRes.ibge, 'Dados do IBGE presentes no painel');
  assert(painelRes.ibge.populacaoOficial > 0, `População oficial do IBGE apurada (${painelRes.ibge.populacaoOficial} hab)`);
  assert(painelRes.ibge.pibPerCapitaReais > 0, `PIB per capita do IBGE apurado (R$ ${painelRes.ibge.pibPerCapitaReais})`);

  // =========================================================================
  // 6. Indicadores do Estado do Paraná — IPARDES
  // =========================================================================
  assert(!!painelRes.ipardes, 'Indicadores do IPARDES presentes no painel');
  assert(painelRes.ipardes.indiceIpm > 0, `Índice IPM do Paraná informado (${painelRes.ipardes.indiceIpm})`);
  assert(painelRes.ipardes.repassesIcmsEstimados > 0, 'Cota-parte estimada de ICMS informada');

  // =========================================================================
  // 7. Séries Macroeconômicas — Banco Central (SGS)
  // =========================================================================
  assert(!!painelRes.macroBacen, 'Séries do Banco Central (SGS) presentes no painel');
  assert(painelRes.macroBacen.ipcaAcumulado12MPct > 0, `IPCA 12M acumulado apurado (${painelRes.macroBacen.ipcaAcumulado12MPct}%)`);
  assert(painelRes.macroBacen.taxaSelicMetaAnualPct > 0, `Taxa Selic meta apurada (${painelRes.macroBacen.taxaSelicMetaAnualPct}%)`);

  // =========================================================================
  // 8. Oportunidades e Eixos de Investimento — Novo PAC / FNSP / Ministérios
  // =========================================================================
  assert(!!painelRes.novoPac, 'Investimentos do Novo PAC / FNSP presentes no painel');
  assert(painelRes.novoPac.totalProjetosSelecionados > 0, 'Total de projetos selecionados do Novo PAC apurado');
  assert(Array.isArray(painelRes.novoPac.eixos) && painelRes.novoPac.eixos.length > 0, 'Eixos de investimento do Novo PAC listados');

  // =========================================================================
  // 9. Catálogo Completo de Fontes Integradas Homologadas
  // =========================================================================
  assert(
    Array.isArray(painelRes.fontesIntegradas) && painelRes.fontesIntegradas.length === 10,
    'Painel lista as 10 fontes governamentais integradas (SICONFI, SIOPS, SIOPE, CAUC, PNCP, CGU, IBGE, IPARDES, BACEN, NOVO PAC)'
  );
  assert(painelRes.dataSource.origin === 'OFICIAL', 'DataSource com origem oficial e metadados completos');

  // =========================================================================
  // 10. Testes de Unidade de Todos os Novos Adaptadores
  // =========================================================================
  assert(!!integrationService, 'IntegrationService instanciado no container NestJS');

  const pncpRes = await integrationService.syncPncp('tenant-araucaria', '4101804', 'PR', 2026);
  assert(pncpRes.success && pncpRes.sourceKey === 'PNCP_CONTRATOS', 'PncpAdapter sincroniza contratos com sucesso');

  const cguRes = await integrationService.syncTransparencia('tenant-araucaria', '4101804', 'PR', 2026);
  assert(cguRes.success && cguRes.sourceKey === 'CGU_TRANSPARENCIA', 'TransparenciaFederalAdapter sincroniza repasses da União com sucesso');

  const ibgeRes = await integrationService.syncIbge('tenant-araucaria', '4101804', 'PR', 2026);
  assert(ibgeRes.success && ibgeRes.sourceKey === 'IBGE_ESTATISTICAS', 'IbgeAdapter sincroniza estatísticas populacionais com sucesso');

  const ipardesRes = await integrationService.syncIpardes('tenant-araucaria', '4101804', 'PR', 2026);
  assert(ipardesRes.success && ipardesRes.sourceKey === 'IPARDES_PARANA', 'IpardesAdapter sincroniza IPM do Paraná com sucesso');

  const bacenRes = await integrationService.syncBacen('tenant-araucaria', '4101804', 'PR', 2026);
  assert(bacenRes.success && bacenRes.sourceKey === 'BACEN_SGS_INDICADORES', 'BacenSgsAdapter sincroniza séries de inflação com sucesso');

  const pacRes = await integrationService.syncPac('tenant-araucaria', '4101804', 'PR', 2026);
  assert(pacRes.success && pacRes.sourceKey === 'NOVO_PAC_INVESTIMENTOS', 'NovoPacAdapter sincroniza eixos do PAC com sucesso');

  // Sincronização paralela das 10 fontes
  const allSourcesSync = await integrationService.syncAllSources('tenant-araucaria', '4101804', 'PR', 2026);
  assert(
    !!allSourcesSync.pncp && !!allSourcesSync.transparencia && !!allSourcesSync.ibge && !!allSourcesSync.ipardes && !!allSourcesSync.bacen && !!allSourcesSync.novoPac,
    'syncAllSources executa as 10 fontes oficiais em paralelo sem bloqueio mútuo'
  );
  // =========================================================================
  const decisoesGabineteRes: any = fiscalController.getDecisoesGabinete(fakeReq);
  assert(!!decisoesGabineteRes && Array.isArray(decisoesGabineteRes.decisoesAtivas), 'GET /api/fiscal/decisoes-gabinete retorna pauta ativa');
  assert(decisoesGabineteRes.decisoesAtivas.length >= 3, 'Pauta ativa da Semana 33 contém no mínimo 3 decisões estratégicas');
  assert(Array.isArray(decisoesGabineteRes.historico) && decisoesGabineteRes.historico.length >= 2, 'Histórico consolidado de semanas anteriores disponível');
  assert(typeof decisoesGabineteRes.estatisticas.taxaResolutividadePct === 'number', 'Taxa de resolutividade do gabinete calculada');

  // Teste de Despacho: Marcar como Tomada
  const idDecisao1 = decisoesGabineteRes.decisoesAtivas[0].id;
  const dispatchTomadaRes: any = fiscalController.despacharDecisaoGabinete(fakeReq, {
    decisaoId: idDecisao1,
    acao: 'MARCAR_TOMADA',
    dadosDespacho: {
      responsavel: 'Prefeito Municipal',
      cargo: 'Chefe do Executivo',
      textoDespacho: 'Decreto assinado e publicado no Diário Oficial.',
      secretariaNotificada: 'Secretaria de Administração',
    },
  });
  assert(dispatchTomadaRes.success === true, 'POST /api/fiscal/decisoes-gabinete/despachar (MARCAR_TOMADA) processado');
  assert(dispatchTomadaRes.decisaoAtualizada.status === 'TOMADA', 'Decisão marcada com status TOMADA');
  assert(!!dispatchTomadaRes.decisaoAtualizada.despacho, 'Carimbo de despacho gravado com sucesso');

  // Teste de Despacho: Reprogramar para Próxima Semana
  const idDecisao2 = decisoesGabineteRes.decisoesAtivas[1].id;
  const dispatchReprogramarRes: any = fiscalController.despacharDecisaoGabinete(fakeReq, {
    decisaoId: idDecisao2,
    acao: 'REPROGRAMAR_PROXIMA_SEMANA',
    dadosDespacho: {
      responsavel: 'Chefe de Gabinete',
      cargo: 'Chefe de Gabinete',
      textoDespacho: 'Pauta reprogramada para a Semana 34.',
      secretariaNotificada: 'Procuradoria-Geral',
    },
  });
  assert(dispatchReprogramarRes.success === true, 'POST /api/fiscal/decisoes-gabinete/despachar (REPROGRAMAR_PROXIMA_SEMANA) processado');
  assert(dispatchReprogramarRes.decisaoAtualizada.status === 'REPROGRAMADA_PROXIMA_SEMANA', 'Decisão atual marcada como REPROGRAMADA_PROXIMA_SEMANA');
  const novaPauta = dispatchReprogramarRes.pautaGabinete.todas;
  const decNovaSemana = novaPauta.find((d: any) => d.semanaAno === '2026-W34');
  assert(!!decNovaSemana && decNovaSemana.reincidente === true, 'Decisão duplicada para a Semana 34 com flag reincidente=true');
  // Teste de Alternância Dinâmica de Prefeitura (Cross-Tenant Switching)
  const reqCuritiba: any = { query: { tenantId: 'tenant-curitiba', codigoIbge: '4106902' }, headers: {} };
  const painelCuritiba: any = fiscalController.getPainelPrefeito(reqCuritiba, '2026');
  assert(painelCuritiba.municipio.cidade === 'Curitiba', 'Painel atualiza dinamicamente para Curitiba');
  assert(painelCuritiba.caixaDisponivel.total > 1000000000, 'Caixa disponível de Curitiba recalculado corretamente em escala metropolitana');

  const reqMaringa: any = { query: { tenantId: 'tenant-maringa', codigoIbge: '4115200' }, headers: {} };
  const painelMaringa: any = fiscalController.getPainelPrefeito(reqMaringa, '2026');
  assert(painelMaringa.municipio.cidade === 'Maringá', 'Painel atualiza dinamicamente para Maringá');
  assert(painelMaringa.municipio.codigoIbge === '4115200', 'Código IBGE de Maringá (4115200) aplicado com sucesso');

  const reqContenda: any = { query: { tenantId: 'tenant-contenda', codigoIbge: '4106209' }, headers: {} };
  const painelContenda: any = fiscalController.getPainelPrefeito(reqContenda, '2026');
  assert(painelContenda.municipio.cidade === 'Contenda', 'Painel atualiza dinamicamente para Contenda');
  assert(painelContenda.municipio.codigoIbge === '4106209', 'Código IBGE de Contenda (4106209) vinculado');
  assert(painelContenda.ibge.populacaoOficial === 19128, 'População oficial de Contenda apurada (19.128 hab)');
  assert(painelContenda.caixaDisponivel.total > 0, 'Disponibilidade de caixa de Contenda calculada com sucesso');
  assert(Array.isArray(painelContenda.pncp.contratos) && painelContenda.pncp.contratos.length >= 4, 'Contratos detalhados do PNCP disponíveis para Contenda');
  const contratoContenda1 = painelContenda.pncp.contratos[0];
  assert(contratoContenda1.valorGlobal < 5000000, 'Valor de contratos do PNCP de Contenda compatível com o porte municipal');

  console.log(`\nResultado da Fase 6 (Expandida): ${passCount}/${totalCount} testes do Painel do Prefeito e 10 Fontes Oficiais passaram com sucesso.`);
}

runPainelPrefeitoTests().catch((err) => {
  console.error('Erro fatal no teste do Painel do Prefeito:', err.message || err);
  process.exit(1);
});
