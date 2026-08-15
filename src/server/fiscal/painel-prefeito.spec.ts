import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FiscalController } from './fiscal.controller';

async function runPainelPrefeitoTests() {
  console.log('--- [TESTE DE PAINEL DO PREFEITO FASE 6: NESTJS] ---');
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

  // 1. Consulta ao endpoint do Painel do Prefeito
  const painelRes: any = fiscalController.getPainelPrefeito(fakeReq, '2026');
  assert(!!painelRes, 'GET /api/fiscal/painel-prefeito retorna payload');
  assert(painelRes.municipio.cidade === 'Araucária', 'Painel contextualizado para município correto');

  // 2. Validação do Semáforo Fiscal
  assert(
    ['VERDE', 'AMARELO', 'VERMELHO'].includes(painelRes.semaforo.status),
    'Semáforo fiscal geral calculado com status válido'
  );
  assert(painelRes.semaforo.motivo.length > 0, 'Semáforo contém justificativa técnica clara');

  // 3. Validação do Caixa Disponível Real
  assert(
    painelRes.caixaDisponivel.total > 0 &&
    painelRes.caixaDisponivel.recursosLivres > 0 &&
    painelRes.caixaDisponivel.recursosVinculados > 0,
    'Caixa segregado em recursos livres (investimentos) e vinculados (saúde/educação)'
  );

  // 4. Validação da Margem da Folha em Reais (R$)
  assert(
    typeof painelRes.margemFolha.margemAtePrudencialReais === 'number' &&
    typeof painelRes.margemFolha.margemAteLegalReais === 'number',
    'Margem da folha calculada em Reais (R$) nominais até limite prudencial e legal'
  );
  assert(painelRes.margemFolha.gastoAtual > 0, 'Gasto com pessoal calculado a partir da RCL');

  // 5. Validação da Meta de Captação
  assert(
    painelRes.captacao.metaAnual > 0 && painelRes.captacao.percentual > 0,
    'Meta anual de captação de convênios e % realizado calculados'
  );

  // 6. Validação das Top 3 Decisões Urgentes da Semana
  assert(
    Array.isArray(painelRes.decisoesUrgentes) && painelRes.decisoesUrgentes.length === 3,
    'Top 3 Decisões Urgentes da Semana geradas com prioridades e prazos'
  );
  assert(
    !!painelRes.decisoesUrgentes[0].impactoFinanceiro && !!painelRes.decisoesUrgentes[0].acaoSugerida,
    'Decisões contêm impacto financeiro estimado em R$ e ação sugerida ao prefeito'
  );

  // 7. Validação do DataSourceBadge
  assert(!!painelRes.dataSource && !!painelRes.dataSource.origin, 'Metadado dataSource anexado');

  console.log(`\nResultado da Fase 6: ${passCount}/${totalCount} testes do Painel do Prefeito passaram com sucesso.`);
}

runPainelPrefeitoTests().catch((err) => {
  console.error('Erro fatal no teste do Painel do Prefeito:', err);
  process.exit(1);
});
