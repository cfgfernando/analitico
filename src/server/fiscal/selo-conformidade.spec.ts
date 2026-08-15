import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runSeloConformidadeTests() {
  console.log('--- [TESTE DE SELO DE CONFORMIDADE FISCAL FASE 10: NESTJS] ---');
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

  // 1. Consulta ao endpoint de Selo de Conformidade
  const seloRes: any = fiscalController.getSeloConformidade(fakeReq, '2026');
  assert(!!seloRes && !!seloRes.nivelSelo, 'GET /api/fiscal/selo-conformidade retorna payload do selo');
  assert(seloRes.municipio.cidade === 'Araucária', 'Selo contextualizado para município correto');

  // 2. Validação da Classificação do Selo
  assert(
    ['DIAMANTE', 'OURO', 'PRATA', 'BRONZE', 'IRREGULAR'].includes(seloRes.nivelSelo),
    'Nível do selo classificado em categoria oficial válida'
  );
  assert(
    typeof seloRes.pontuacaoTotal === 'number' && seloRes.pontuacaoTotal >= 0 && seloRes.pontuacaoTotal <= 100,
    'Pontuação total apurada na escala de 0 a 100 pontos'
  );

  // 3. Validação dos 6 Pilares de Auditoria
  assert(
    Array.isArray(seloRes.criterios) && seloRes.criterios.length === 6,
    '6 pilares de conformidade constitucional e fiscal auditados'
  );
  for (const crit of seloRes.criterios) {
    assert(
      ['CUMPRIDO', 'ALERTA', 'DESCUMPRIDO'].includes(crit.status),
      `Critério '${crit.nome}' possui status de conformidade válido`
    );
    assert(!!crit.fundamentoLegal, `Critério '${crit.nome}' contém fundamentação legal`);
  }

  // 4. Validação do Código de Autenticidade Digital
  assert(
    !!seloRes.codigoAutenticidade && seloRes.codigoAutenticidade.startsWith('CERT-'),
    'Código de autenticidade digital gerado com formato de validação'
  );

  // 5. Validação do Widget de Incorporação para Portal da Transparência
  assert(
    !!seloRes.embedWidgetHtml && seloRes.embedWidgetHtml.includes('<div') && seloRes.embedWidgetHtml.includes('SELO'),
    'Código HTML do widget para incorporação no Portal da Transparência gerado'
  );

  console.log(`\nResultado da Fase 10: ${passCount}/${totalCount} testes do Selo de Conformidade passaram com sucesso.`);
}

runSeloConformidadeTests().catch((err) => {
  console.error('Erro fatal no teste do Selo de Conformidade:', err);
  process.exit(1);
});
