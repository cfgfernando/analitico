/**
 * PncpConnectorService — Conector com a API Oficial do Portal Nacional de Contratações Públicas (PNCP / Lei 14.133/2021)
 *
 * Endpoints Oficiais:
 * - Consulta de Contratos por Órgão: https://pncp.gov.br/api/consulta/v1/contratos
 */

export interface PncpContratoItem {
  numeroContratoEmpenho: string;
  anoContrato: number;
  razaoSocialContratado: string;
  cnpjContratado: string;
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  valorAcumulado: number;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  categoriaProcesso?: string;
  nomeOrgao?: string;
}

export interface PncpSyncResult {
  sucesso: boolean;
  totalContratosImportados: number;
  valorTotalHomologado: number;
  fonte: string;
  origem: 'OFICIAL';
  dataSincronizacao: string;
  mensagem: string;
}

export class PncpConnectorService {
  private static readonly PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';
  private static readonly PNCP_API_URL = 'https://pncp.gov.br/api/consulta/v1/contratos';

  /**
   * Consulta a API do PNCP para obter os contratos homologados de um CNPJ municipal
   * Compatível com o Manual de Integração e Consultas v2.5 do PNCP
   */
  public static async fetchContratosByCnpj(
    cnpj: string,
    ano = 2025,
    maxRetries = 2
  ): Promise<PncpContratoItem[]> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const dtIni = `${ano - 1}0101`;
    const dtFim = `${ano + 1}1231`;

    const endpoints = [
      `${this.PNCP_API_URL}?dataInicial=${dtIni}&dataFinal=${dtFim}&cnpjOrgao=${cleanCnpj}&pagina=1&tamanhoPagina=50`,
      `${this.PNCP_BASE_URL}/contratos?dataInicial=${ano}0101&dataFinal=${ano}1231&cnpjOrgao=${cleanCnpj}&pagina=1&tamanhoPagina=50`,
      `${this.PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dtIni}&dataFinal=${dtFim}&cnpjOrgao=${cleanCnpj}&pagina=1&tamanhoPagina=50`,
      `${this.PNCP_BASE_URL}/contratos/atualizacao?dataInicial=${dtIni}&dataFinal=${dtFim}&pagina=1&tamanhoPagina=50`,
    ];

    for (const url of endpoints) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SaaS-Fiscal-Prefeituras-PNCP/1.0',
            },
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const json = await response.json();
            const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
            if (items.length > 0) {
              return items.map((item: any) => ({
                numeroContratoEmpenho: item.numeroContratoEmpenho || item.numeroCompra || `${item.sequencialContrato || item.sequencialCompra || '1'}/${ano}`,
                anoContrato: item.anoContrato || item.anoCompra || ano,
                razaoSocialContratado: item.nomeRazaoSocialFornecedor || item.razaoSocialContratado || item.fornecedor || 'Fornecedor Homologado PNCP',
                cnpjContratado: item.niFornecedor || item.cnpjContratado || '00.000.000/0000-00',
                objetoContrato: item.objetoContrato || item.objetoCompra || 'Prestação de serviços públicos homologada no PNCP',
                valorInicial: Number(item.valorInicial || item.valorGlobal || item.valorTotalHomologado || item.valorTotalEstimado || 0),
                valorGlobal: Number(item.valorGlobal || item.valorInicial || item.valorTotalHomologado || item.valorTotalEstimado || 0),
                valorAcumulado: Number(item.valorAcumulado || item.valorExecutado || 0),
                dataVigenciaInicio: item.dataVigenciaInicio || item.dataPublicacaoPncp || `${ano}-01-01`,
                dataVigenciaFim: item.dataVigenciaFim || `${ano}-12-31`,
                categoriaProcesso: item.categoriaProcesso || item.categoria || 'SERVICOS',
                nomeOrgao: item.nomeOrgao || item.orgaoEntidade?.razaosocial,
              }));
            }
          }
        } catch (err: any) {
          console.warn(`[PNCP Connector] Tentativa ${attempt} na URL ${url} falhou: ${err.message}`);
          if (attempt === maxRetries) break;
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    // Se a API PNCP não retornar registros ou falhar, retorna array vazio
    return [];
  }

  /**
   * Determina a criticidade automática com base nas palavras-chave do objeto
   */
  public static inferCriticidade(objeto: string, categoria: string): {
    criticidade: 'ESSENCIAL' | 'IMPORTANTE' | 'DIFERIVEL';
    impacto: 'ALTO' | 'MEDIO' | 'BAIXO';
  } {
    const texto = `${objeto} ${categoria}`.toLowerCase();

    if (
      texto.includes('medicamento') ||
      texto.includes('hospital') ||
      texto.includes('saúde') ||
      texto.includes('merenda') ||
      texto.includes('pronto socorro') ||
      texto.includes('ambulância') ||
      texto.includes('leito')
    ) {
      return { criticidade: 'ESSENCIAL', impacto: 'ALTO' };
    }

    if (
      texto.includes('vigilância') ||
      texto.includes('limpeza') ||
      texto.includes('transporte escolar') ||
      texto.includes('pavimentação') ||
      texto.includes('manutenção predial') ||
      texto.includes('coleta de lixo') ||
      texto.includes('software') ||
      texto.includes('sistema de gestão')
    ) {
      return { criticidade: 'IMPORTANTE', impacto: 'MEDIO' };
    }

    return { criticidade: 'DIFERIVEL', impacto: 'BAIXO' };
  }
}
