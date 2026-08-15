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

  // 1. Consulta ao endpoint de Radar de Captação
  const radarRes: any = fiscalController.getRadarCaptacao(fakeReq);
  assert(!!radarRes && Array.isArray(radarRes.programas), 'GET /api/fiscal/radar-captacao retorna lista de programas');
  assert(radarRes.programas.length > 0, 'Programas abertos de captação encontrados no catálogo');

  // 2. Validação dos Critérios de Elegibilidade (CAUC / CAPAG)
  const firstProg = radarRes.programas[0];
  assert(
    ['ELEGIVEL', 'RESTRICAO', 'INELEGIVEL'].includes(firstProg.elegibilidade.status),
    'Algoritmo de elegibilidade municipal classifica status corretamente'
  );
  assert(
    Array.isArray(firstProg.elegibilidade.motivos) && firstProg.elegibilidade.motivos.length > 0,
    'Elegibilidade inclui justificativas e requisitos atendidos'
  );

  // 3. Linha do Tempo de Prazos (Timeline com contagem regressiva)
  assert(
    typeof firstProg.diasRestantes === 'number' && firstProg.diasRestantes >= 0,
    'Contagem regressiva de dias restantes calculada com base na data de encerramento'
  );
  assert(
    ['URGENTE', 'MODERADO', 'CONFORTAVEL', 'ENCERRADO'].includes(firstProg.statusPrazo),
    'Status de urgência do prazo classificado'
  );

  // 4. Teste do Simulador de Contrapartida em R$
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

  console.log(`\nResultado da Fase 7: ${passCount}/${totalCount} testes de Radar de Captação passaram com sucesso.`);
}

runRadarCaptacaoTests().catch((err) => {
  console.error('Erro fatal no teste do Radar de Captação:', err);
  process.exit(1);
});
