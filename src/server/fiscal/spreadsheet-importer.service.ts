/**
 * SpreadsheetImporterService — Motor de importação e normalização de planilhas de contratos públicos
 * Suporta formatos CSV (delimitadores vírgula ou ponto-e-vírgula) e converte para o modelo Prisma.
 */

export interface ContratoCsvRow {
  numero: string;
  secretaria_codigo: string;
  secretaria_nome: string;
  empresa: string;
  objeto: string;
  categoria: string;
  valor_total: number;
  valor_liquidado: number;
  criticidade?: 'ESSENCIAL' | 'IMPORTANTE' | 'DIFERIVEL';
  impacto_municipal?: 'ALTO' | 'MEDIO' | 'BAIXO';
  impacto_social?: string;
  data_inicio: string;
  data_fim: string;
}

export interface ImportValidationResult {
  valid: boolean;
  totalLinhas: number;
  linhasValidas: ContratoCsvRow[];
  erros: { linha: number; campo?: string; mensagem: string }[];
  resumoFinanceiro: {
    totalContratos: number;
    valorTotal: number;
    valorLiquidado: number;
    secretariasDetectadas: string[];
  };
}

export class SpreadsheetImporterService {
  /**
   * Converte string monetária brasileira ou internacional para número float
   * Exemplos: "R$ 1.250.000,50" -> 1250000.5 | "1250000.50" -> 1250000.5 | " 450.000 " -> 450000
   */
  public static parseMonetaryValue(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;

    let str = String(val).trim().replace(/^R\$\s*/i, '');
    // Se tiver vírgula como decimal (padrão brasileiro "1.250,50")
    if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  /**
   * Converte formatos de data ("DD/MM/YYYY" ou "YYYY-MM-DD") para ISO Date string
   */
  public static parseDate(dateStr: any): string | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();

    // Formato brasileiro DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Formato ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    return null;
  }

  /**
   * Parser inteligente de conteúdo CSV
   */
  public static parseAndValidateCsv(csvContent: string): ImportValidationResult {
    const lines = csvContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      return {
        valid: false,
        totalLinhas: 0,
        linhasValidas: [],
        erros: [{ linha: 0, mensagem: 'O arquivo enviado está vazio.' }],
        resumoFinanceiro: { totalContratos: 0, valorTotal: 0, valorLiquidado: 0, secretariasDetectadas: [] },
      };
    }

    // Detecta delimitador no cabeçalho (vírgula ou ponto-e-vírgula)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    // Mapeamento flexível de cabeçalhos
    const colMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      if (h.includes('numero') || h.includes('número') || h === 'num') colMap['numero'] = idx;
      else if (h.includes('sec_cod') || h.includes('secretaria_codigo') || h === 'codigo_secretaria') colMap['secretaria_codigo'] = idx;
      else if (h.includes('secretaria') || h.includes('pasta')) colMap['secretaria_nome'] = idx;
      else if (h.includes('empresa') || h.includes('fornecedor') || h.includes('contratada')) colMap['empresa'] = idx;
      else if (h.includes('objeto') || h.includes('descricao') || h.includes('descrição')) colMap['objeto'] = idx;
      else if (h.includes('categoria') || h.includes('tipo')) colMap['categoria'] = idx;
      else if (h.includes('valor_total') || h.includes('val_total') || h === 'valor') colMap['valor_total'] = idx;
      else if (h.includes('liquidado') || h.includes('valor_liquidado') || h.includes('pago')) colMap['valor_liquidado'] = idx;
      else if (h.includes('criticidade')) colMap['criticidade'] = idx;
      else if (h.includes('impacto_municipal') || h.includes('impacto')) colMap['impacto_municipal'] = idx;
      else if (h.includes('impacto_social') || h.includes('social')) colMap['impacto_social'] = idx;
      else if (h.includes('inicio') || h.includes('início') || h.includes('data_inicio')) colMap['data_inicio'] = idx;
      else if (h.includes('fim') || h.includes('termino') || h.includes('término') || h.includes('data_fim')) colMap['data_fim'] = idx;
    });

    const erros: { linha: number; campo?: string; mensagem: string }[] = [];
    const linhasValidas: ContratoCsvRow[] = [];
    const secretariasSet = new Set<string>();
    let somaTotal = 0;
    let somaLiq = 0;

    // Itera pelas linhas de dados (a partir da linha 2)
    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length < 4) {
        erros.push({ linha: lineNum, mensagem: 'Linha com número insuficiente de colunas.' });
        continue;
      }

      const numero = cols[colMap['numero'] ?? 0];
      const secNome = cols[colMap['secretaria_nome'] ?? 1] || 'Secretaria Geral';
      const secCodigo = cols[colMap['secretaria_codigo'] ?? 2] || secNome.substring(0, 6).toUpperCase().replace(/\s+/g, '_');
      const empresa = cols[colMap['empresa'] ?? 3];
      const objeto = cols[colMap['objeto'] ?? 4] || 'Prestação de serviços contínuos';
      const categoria = (cols[colMap['categoria'] ?? 5] || 'GERAL').toUpperCase();
      const valTotal = this.parseMonetaryValue(cols[colMap['valor_total'] ?? 6]);
      const valLiq = this.parseMonetaryValue(cols[colMap['valor_liquidado'] ?? 7]);

      let criticidadeRaw = (cols[colMap['criticidade']] || '').toUpperCase();
      let criticidade: 'ESSENCIAL' | 'IMPORTANTE' | 'DIFERIVEL' | undefined = undefined;
      if (['ESSENCIAL', 'IMPORTANTE', 'DIFERIVEL'].includes(criticidadeRaw)) {
        criticidade = criticidadeRaw as any;
      }

      let impactoRaw = (cols[colMap['impacto_municipal']] || '').toUpperCase();
      let impacto: 'ALTO' | 'MEDIO' | 'BAIXO' = 'MEDIO';
      if (['ALTO', 'MEDIO', 'BAIXO'].includes(impactoRaw)) {
        impacto = impactoRaw as any;
      }

      const impactoSocial = cols[colMap['impacto_social']] || undefined;
      const dataInicio = this.parseDate(cols[colMap['data_inicio']]) || '2025-01-01';
      const dataFim = this.parseDate(cols[colMap['data_fim']]) || '2025-12-31';

      if (!numero) {
        erros.push({ linha: lineNum, campo: 'numero', mensagem: 'Número do contrato não informado.' });
        continue;
      }
      if (!empresa) {
        erros.push({ linha: lineNum, campo: 'empresa', mensagem: 'Fornecedor/Empresa não informado.' });
        continue;
      }
      if (valTotal <= 0) {
        erros.push({ linha: lineNum, campo: 'valor_total', mensagem: `Valor total do contrato ${numero} deve ser maior que zero.` });
        continue;
      }

      secretariasSet.add(secNome);
      somaTotal += valTotal;
      somaLiq += valLiq;

      linhasValidas.push({
        numero,
        secretaria_codigo: secCodigo,
        secretaria_nome: secNome,
        empresa,
        objeto,
        categoria,
        valor_total: valTotal,
        valor_liquidado: valLiq,
        criticidade,
        impacto_municipal: impacto,
        impacto_social: impactoSocial,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
    }

    return {
      valid: erros.length === 0 && linhasValidas.length > 0,
      totalLinhas: lines.length - 1,
      linhasValidas,
      erros,
      resumoFinanceiro: {
        totalContratos: linhasValidas.length,
        valorTotal: somaTotal,
        valorLiquidado: somaLiq,
        secretariasDetectadas: Array.from(secretariasSet),
      },
    };
  }

  /**
   * Gera o conteúdo de um modelo CSV padrão para download pelo gestor municipal
   */
  public static generateTemplateCsv(): string {
    const headers = [
      'numero',
      'secretaria_codigo',
      'secretaria_nome',
      'empresa',
      'objeto',
      'categoria',
      'valor_total',
      'valor_liquidado',
      'criticidade',
      'impacto_municipal',
      'impacto_social',
      'data_inicio',
      'data_fim',
    ].join(';');

    const sampleRows = [
      '101/2025;SAUDE;Secretaria Municipal de Saúde;Pharma Distribuidora Ltda;Fornecimento de medicamentos da atenção básica;MEDICAMENTOS;3500000.00;1750000.00;ESSENCIAL;ALTO;Atende 30.000 pacientes/mês nas UBS;01/01/2025;31/12/2025',
      '102/2025;EDUCACAO;Secretaria Municipal de Educação;NutriEscola Alimentos S.A.;Merenda escolar para a rede municipal;MERENDA;2800000.00;1400000.00;ESSENCIAL;ALTO;Alimenta 15.000 alunos diariamente;01/01/2025;31/12/2025',
      '103/2025;OBRAS;Secretaria Municipal de Obras Públicas;Pavimenta Engenharia Eireli;Manutenção de vias públicas e tapa-buraco;PAVIMENTACAO;1900000.00;950000.00;IMPORTANTE;MEDIO;Recape de 45 km de vias urbanas;15/01/2025;31/12/2025',
      '104/2025;ADMIN;Secretaria Municipal de Administração;SegurMax Vigilância Armada;Vigilância patrimonial armada e desarmada dos prédios públicos;VIGILANCIA;1200000.00;600000.00;IMPORTANTE;MEDIO;40 postos de trabalho 24h;01/01/2025;31/12/2025',
      '105/2025;ADMIN;Secretaria Municipal de Administração;Café & Eventos Serviços;Fornecimento de café, água mineral e insumos de copa;COPA_COZINHA;95000.00;45000.00;DIFERIVEL;BAIXO;Insumos para reuniões internas;01/01/2025;31/12/2025',
    ].join('\n');

    return `${headers}\n${sampleRows}\n`;
  }
}
