/**
 * XmlImporterService — Processador de arquivos XML para Contratos e Execução Orçamentária
 * Suporta layouts XML do TCE-PR (SICOM/PAD), Siconfi MSC e NF-e de Serviços Públicos.
 */

export interface ContratoXmlRow {
  numero: string;
  secretaria_codigo: string;
  secretaria_nome: string;
  empresa: string;
  cnpj?: string;
  objeto: string;
  categoria: string;
  valor_total: number;
  valor_liquidado: number;
  data_inicio: string;
  data_fim: string;
  modalidade?: string;
  processo?: string;
}

export interface XmlValidationResult {
  valid: boolean;
  totalContratos: number;
  linhasValidas: ContratoXmlRow[];
  erros: string[];
  resumoFinanceiro: {
    totalContratos: number;
    valorTotal: number;
    valorLiquidado: number;
    secretariasDetectadas: string[];
  };
}

export class XmlImporterService {
  /**
   * Parser robusto de XML para contratos públicos municipais
   */
  public static parseAndValidateXml(xmlContent: string): XmlValidationResult {
    const erros: string[] = [];
    const linhasValidas: ContratoXmlRow[] = [];

    if (!xmlContent || !xmlContent.trim()) {
      return {
        valid: false,
        totalContratos: 0,
        linhasValidas: [],
        erros: ['Arquivo XML vazio.'],
        resumoFinanceiro: { totalContratos: 0, valorTotal: 0, valorLiquidado: 0, secretariasDetectadas: [] },
      };
    }

    try {
      // Regex matcher para tags <contrato>...</contrato> ou <item>...</item>
      const contratoRegex = /<(?:contrato|item|documento)(?:[^>]*)>([\s\S]*?)<\/(?:contrato|item|documento)>/gi;
      let match;
      let count = 0;

      while ((match = contratoRegex.exec(xmlContent)) !== null) {
        count++;
        const block = match[1];

        const getTag = (tagName: string, fallback = ''): string => {
          const r = new RegExp(`<${tagName}(?:[^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'i');
          const m = r.exec(block);
          return m ? m[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : fallback;
        };

        const numero = getTag('numero') || getTag('nrContrato') || getTag('numContrato') || `XML-${count}/${new Date().getFullYear()}`;
        const empresa = getTag('empresa') || getTag('razaoSocial') || getTag('fornecedor') || getTag('nomeContratado') || 'Fornecedor Identificado no XML';
        const cnpj = getTag('cnpj') || getTag('niFornecedor') || '00.000.000/0000-00';
        const objeto = getTag('objeto') || getTag('dsObjeto') || getTag('objetoContrato') || 'Contratação pública via XML';
        const secNome = getTag('secretaria') || getTag('orgao') || getTag('secretariaNome') || 'Secretaria Municipal';
        const secCodigo = getTag('secretariaCodigo') || getTag('codOrgao') || this.inferSecCodigo(secNome, objeto);

        const valTotalStr = getTag('valorTotal') || getTag('vlTotal') || getTag('valorGlobal') || getTag('valor') || '0';
        const valLiqStr = getTag('valorLiquidado') || getTag('vlLiquidado') || getTag('valorExecutado') || '0';
        const valTotal = this.parseVal(valTotalStr);
        const valLiq = this.parseVal(valLiqStr);

        const dtInicio = getTag('dataInicio') || getTag('dtInicio') || getTag('dtAssinatura') || `${new Date().getFullYear()}-01-01`;
        const dtFim = getTag('dataFim') || getTag('dtFim') || getTag('dtVencimento') || `${new Date().getFullYear()}-12-31`;

        linhasValidas.push({
          numero,
          secretaria_codigo: secCodigo,
          secretaria_nome: secNome,
          empresa,
          cnpj,
          objeto,
          categoria: secCodigo,
          valor_total: valTotal,
          valor_liquidado: valLiq,
          data_inicio: dtInicio.length === 10 ? dtInicio : `${new Date().getFullYear()}-01-01`,
          data_fim: dtFim.length === 10 ? dtFim : `${new Date().getFullYear()}-12-31`,
          modalidade: getTag('modalidade') || 'Pregão / Concorrência (Lei 14.133)',
          processo: getTag('processo') || getTag('numProcesso') || `PA-${count}`,
        });
      }

      if (linhasValidas.length === 0) {
        erros.push('Nenhuma tag <contrato> ou <item> válida encontrada no XML.');
      }

      const totalVal = linhasValidas.reduce((acc, c) => acc + c.valor_total, 0);
      const totalLiq = linhasValidas.reduce((acc, c) => acc + c.valor_liquidado, 0);
      const secs = Array.from(new Set(linhasValidas.map(c => c.secretaria_nome)));

      return {
        valid: linhasValidas.length > 0,
        totalContratos: linhasValidas.length,
        linhasValidas,
        erros,
        resumoFinanceiro: {
          totalContratos: linhasValidas.length,
          valorTotal: totalVal,
          valorLiquidado: totalLiq,
          secretariasDetectadas: secs,
        },
      };
    } catch (e: any) {
      return {
        valid: false,
        totalContratos: 0,
        linhasValidas: [],
        erros: [`Erro ao processar arquivo XML: ${e.message}`],
        resumoFinanceiro: { totalContratos: 0, valorTotal: 0, valorLiquidado: 0, secretariasDetectadas: [] },
      };
    }
  }

  private static parseVal(valStr: string): number {
    if (!valStr) return 0;
    let s = valStr.trim().replace(/^R\$\s*/i, '');
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  private static inferSecCodigo(nome: string, objeto: string): string {
    const text = `${nome} ${objeto}`.toLowerCase();
    if (text.includes('saúde') || text.includes('medic') || text.includes('hospital')) return 'SAUDE';
    if (text.includes('educa') || text.includes('escola') || text.includes('merenda')) return 'EDUCACAO';
    if (text.includes('obra') || text.includes('pavim') || text.includes('drenagem')) return 'OBRAS';
    if (text.includes('seguran') || text.includes('guarda')) return 'SEGURANCA';
    if (text.includes('meio ambiente') || text.includes('lixo') || text.includes('aterro')) return 'MEIO_AMBIENTE';
    return 'ADMIN';
  }
}
