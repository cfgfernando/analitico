import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runAlertasProativosTests() {
  console.log('--- [TESTE DE ALERTAS PROATIVOS E RISCOS FISCAIS FASE 11: NESTJS] ---');
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
  assert(alertasRes.totalAlertas >= 5, 'Monitoramento ativo de no mínimo 5 obrigações e riscos legais');

  // 2. Contadores de Severidade
  assert(typeof alertasRes.totalCriticos === 'number', 'Total de alertas críticos calculado');
  assert(typeof alertasRes.totalAtencao === 'number', 'Total de alertas em atenção calculado');

  // 3. Validação dos Prazos e Riscos Auditados
  const categoriasEsperadas = ['CAUC', 'SICONFI', 'LRF_PESSOAL', 'ORCAMENTO', 'CONVENIOS', 'FUNDEB'];
  const categoriasEncontradas = alertasRes.alertas.map((a: any) => a.categoria);
  for (const cat of categoriasEsperadas) {
    assert(categoriasEncontradas.includes(cat), `Monitoramento ativo de categoria regulatória: ${cat}`);
  }

  // 4. Validação Estrutural de Cada Alerta
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

  console.log(`\nResultado da Fase 11: ${passCount}/${totalCount} testes de Alertas Proativos passaram com sucesso.`);
}

runAlertasProativosTests().catch((err) => {
  console.error('Erro fatal no teste de Alertas Proativos:', err);
  process.exit(1);
});
