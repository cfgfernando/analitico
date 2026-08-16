import { Logger } from '@nestjs/common';
import { SiconfiRawItem, SiconfiApiResponse } from './interfaces/siconfi.interface';

/**
 * SiconfiClient — Cliente HTTP Resiliente para a API do Tesouro Nacional (SICONFI Data Lake)
 *
 * Endpoints Oficiais:
 * - /rreo: Relatório Resumido de Execução Orçamentária
 * - /rgf: Relatório de Gestão Fiscal
 * - /dca: Declaração de Contas Anuais
 * - /entes: Metadados do Ente da Federação
 */
export class SiconfiClient {
  private static readonly logger = new Logger(SiconfiClient.name);
  private static readonly BASE_URL = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt';

  /**
   * Executa requisição HTTP com retry exponencial e timeout
   */
  public static async fetchWithRetry(url: string, maxRetries = 2, timeoutMs = 8000): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SaasFiscal-Antigravity/4.0',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`SICONFI API respondeu com status ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        this.logger.warn(`Tentativa ${attempt}/${maxRetries} falhou para ${url}: ${err.message}`);
        if (attempt === maxRetries) {
          throw err;
        }
        await new Promise(r => setTimeout(r, 800 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Busca RREO (Relatório Resumido de Execução Orçamentária)
   * Anexos:
   * - RREO-Anexo 01: Balanço Orçamentário (Receitas e Despesas)
   * - RREO-Anexo 02: Demonstrativo da Execução das Despesas por Função/Subfunção
   * - RREO-Anexo 03: Demonstrativo da Receita Corrente Líquida (RCL)
   * - RREO-Anexo 06: Restos a Pagar
   * - RREO-Anexo 08: Manutenção e Desenvolvimento do Ensino (MDE / Fundeb)
   */
  public static async getRreo(
    ano: number,
    periodo: number,
    codigoIbge: string,
    anexo = 'RREO-Anexo 01'
  ): Promise<SiconfiRawItem[]> {
    const encodedAnexo = encodeURIComponent(anexo);
    const url = `${this.BASE_URL}/rreo?an_exercicio=${ano}&nr_periodo=${periodo}&co_tipo_demonstrativo=RREO&co_poder=E&id_ente=${codigoIbge}&no_anexo=${encodedAnexo}`;
    try {
      const data: SiconfiApiResponse = await this.fetchWithRetry(url, 2, 7000);
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (err: any) {
      this.logger.warn(`[SiconfiClient] Falha ao consultar RREO (${anexo}) do IBGE ${codigoIbge}: ${err.message}.`);
      return [];
    }
  }

  /**
   * Busca RGF (Relatório de Gestão Fiscal)
   * Anexos:
   * - RGF-Anexo 01: Demonstrativo da Despesa com Pessoal (DTP)
   * - RGF-Anexo 02: Demonstrativo da Dívida Consolidada Líquida (DCL)
   */
  public static async getRgf(
    ano: number,
    quadrimestre: number,
    codigoIbge: string,
    anexo = 'RGF-Anexo 01'
  ): Promise<SiconfiRawItem[]> {
    const encodedAnexo = encodeURIComponent(anexo);
    const url = `${this.BASE_URL}/rgf?an_exercicio=${ano}&nr_periodo=${quadrimestre}&co_tipo_demonstrativo=RGF&co_poder=E&id_ente=${codigoIbge}&no_anexo=${encodedAnexo}`;
    try {
      const data: SiconfiApiResponse = await this.fetchWithRetry(url, 2, 7000);
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (err: any) {
      this.logger.warn(`[SiconfiClient] Falha ao consultar RGF (${anexo}) do IBGE ${codigoIbge}: ${err.message}.`);
      return [];
    }
  }

  /**
   * Busca DCA (Declaração de Contas Anuais)
   */
  public static async getDca(ano: number, codigoIbge: string): Promise<SiconfiRawItem[]> {
    const url = `${this.BASE_URL}/dca?an_exercicio=${ano}&id_ente=${codigoIbge}`;
    try {
      const data: SiconfiApiResponse = await this.fetchWithRetry(url, 2, 7000);
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (err: any) {
      this.logger.warn(`[SiconfiClient] Falha ao consultar DCA do IBGE ${codigoIbge}: ${err.message}.`);
      return [];
    }
  }

  /**
   * Busca dados cadastrais e população do ente municipal
   */
  public static async getEnte(codigoIbge: string): Promise<any> {
    const url = `${this.BASE_URL}/entes?id_ente=${codigoIbge}`;
    try {
      const data = await this.fetchWithRetry(url, 2, 5000);
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items[0];
      }
      return null;
    } catch (err: any) {
      this.logger.warn(`[SiconfiClient] Falha ao consultar cadastro do ente ${codigoIbge}: ${err.message}.`);
      return null;
    }
  }

  /**
   * Verifica a saúde e latência da API do Siconfi
   */
  public static async checkHealth(): Promise<{ online: boolean; latencyMs: number; provider: string }> {
    const start = Date.now();
    try {
      const url = `${this.BASE_URL}/entes?id_ente=4106902`;
      await this.fetchWithRetry(url, 1, 4000);
      return { online: true, latencyMs: Date.now() - start, provider: 'SICONFI_DATA_LAKE' };
    } catch (err) {
      return { online: false, latencyMs: Date.now() - start, provider: 'SICONFI_DATA_LAKE' };
    }
  }
}
