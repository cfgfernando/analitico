import 'reflect-metadata';
import { SpreadsheetImporterService } from './spreadsheet-importer.service';
import { PncpConnectorService } from './pncp-connector.service';

async function runSpreadsheetImporterTests() {
  console.log('--- [TESTE DE IMPORTAÇÃO DE PLANILHAS E CONECTOR PNCP: SUÍTE AUTOMATIZADA] ---');
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

  // =========================================================================
  // 1. Parser de Valores Monetários Brasileiros e Internacionais
  // =========================================================================
  console.log('\n[1/4] Testando conversão e parser de moeda...');
  assert(SpreadsheetImporterService.parseMonetaryValue('R$ 1.250.000,50') === 1250000.5, 'Converte "R$ 1.250.000,50" -> 1250000.5');
  assert(SpreadsheetImporterService.parseMonetaryValue('3500000.00') === 3500000, 'Converte formato puro "3500000.00" -> 3500000');
  assert(SpreadsheetImporterService.parseMonetaryValue(' 45.900,00 ') === 45900, 'Converte string com espaços " 45.900,00 " -> 45900');
  assert(SpreadsheetImporterService.parseMonetaryValue(0) === 0, 'Valor zero numérico retorna 0');
  assert(SpreadsheetImporterService.parseMonetaryValue(null) === 0, 'Valor nulo retorna 0');

  // =========================================================================
  // 2. Parser e Validação de Datas
  // =========================================================================
  console.log('\n[2/4] Testando conversão de datas...');
  assert(SpreadsheetImporterService.parseDate('01/02/2025') === '2025-02-01', 'Converte DD/MM/YYYY "01/02/2025" -> "2025-02-01"');
  assert(SpreadsheetImporterService.parseDate('2025-12-31') === '2025-12-31', 'Preserva formato ISO YYYY-MM-DD "2025-12-31"');
  assert(SpreadsheetImporterService.parseDate('invalido') === null, 'Data inválida retorna null');

  // =========================================================================
  // 3. Validação e Parser de Planilha CSV (Delimitador ; e ,)
  // =========================================================================
  console.log('\n[3/4] Testando validação de arquivo CSV...');
  const templateCsv = SpreadsheetImporterService.generateTemplateCsv();
  assert(templateCsv.includes('numero') && templateCsv.includes('valor_total'), 'Template CSV contém cabeçalhos obrigatórios');

  const validacao = SpreadsheetImporterService.parseAndValidateCsv(templateCsv);
  assert(validacao.valid === true, 'Template padrão é 100% válido na verificação');
  assert(validacao.linhasValidas.length === 5, 'Template contém exatamente 5 linhas de contratos de exemplo');
  assert(validacao.resumoFinanceiro.totalContratos === 5, 'Total de contratos do resumo financeiro apurado corretamente');
  assert(validacao.resumoFinanceiro.valorTotal > 0, 'Valor total da planilha calculado com sucesso');
  assert(validacao.resumoFinanceiro.secretariasDetectadas.length >= 3, 'Secretarias (Saúde, Educação, Obras, Admin) detectadas');

  // Teste com CSV inválido (sem número de contrato)
  const csvInvalido = 'numero;secretaria_codigo;secretaria_nome;empresa;valor_total\n;SAUDE;Secretaria de Saúde;Empresa X;1000.00';
  const validacaoInvalida = SpreadsheetImporterService.parseAndValidateCsv(csvInvalido);
  assert(validacaoInvalida.valid === false, 'Detecta inconsistência quando o número do contrato está em branco');
  assert(validacaoInvalida.erros.length > 0, 'Lista de erros contém detalhamento da linha');

  // =========================================================================
  // 4. Inferência de Criticidade Automática do PNCP
  // =========================================================================
  console.log('\n[4/4] Testando regras de inferência do conector PNCP...');
  const inferMed = PncpConnectorService.inferCriticidade('Fornecimento de medicamentos hospitalares', 'SAUDE');
  assert(inferMed.criticidade === 'ESSENCIAL' && inferMed.impacto === 'ALTO', 'Medicamentos classificados como ESSENCIAL/ALTO');

  const inferVig = PncpConnectorService.inferCriticidade('Vigilância armada predial', 'ADMIN');
  assert(inferVig.criticidade === 'IMPORTANTE' && inferVig.impacto === 'MEDIO', 'Vigilância classificada como IMPORTANTE/MEDIO');

  const inferCopa = PncpConnectorService.inferCriticidade('Locação de cafeteiras e insumos de copa', 'OUTROS');
  assert(inferCopa.criticidade === 'DIFERIVEL' && inferCopa.impacto === 'BAIXO', 'Insumos de copa classificados como DIFERIVEL/BAIXO');

  console.log('\n================================================================');
  console.log(`🎉 TODAS AS ${passCount}/${totalCount} ASSERÇÕES DO IMPORTADOR E PNCP FORAM APROVADAS COM SUCESSO!`);
  console.log('🔒 INGESTÃO DE DADOS REAIS HOMOLOGADA E PRONTA PARA PRODUÇÃO');
  console.log('================================================================\n');
}

runSpreadsheetImporterTests().catch(err => {
  console.error('Erro na suíte de testes de importação:', err);
  process.exit(1);
});
