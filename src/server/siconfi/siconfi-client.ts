import { Logger } from '@nestjs/common';
import { SiconfiRawItem, SiconfiApiResponse } from './interfaces/siconfi.interface';

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
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Busca RREO Anexo 01/02/03 para um município e exercício
   */
  public static async getRreo(ano: number, periodo: number, codigoIbge: string, anexo = 'RREO-Anexo 01'): Promise<SiconfiRawItem[]> {
    const url = `${this.BASE_URL}/rreo?an_exercicio=${ano}&nr_periodo=${periodo}&co_tipo_demonstrativo=RREO&co_poder=E&id_ente=${codigoIbge}`;
    try {
      const data: SiconfiApiResponse = await this.fetchWithRetry(url);
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
   * Busca RGF Anexo 01 (DTP/Pessoal) para um município e exercício
   */
  public static async getRgf(ano: number, quadrimestre: number, codigoIbge: string): Promise<SiconfiRawItem[]> {
    const url = `${this.BASE_URL}/rgf?an_exercicio=${ano}&nr_periodo=${quadrimestre}&co_tipo_demonstrativo=RGF&co_poder=E&id_ente=${codigoIbge}`;
    try {
      const data: SiconfiApiResponse = await this.fetchWithRetry(url);
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (err: any) {
      this.logger.warn(`[SiconfiClient] Falha ao consultar RGF do IBGE ${codigoIbge}: ${err.message}.`);
      return [];
    }
  }

  /**
   * Verifica a saúde e latência da API do Siconfi
   */
  public static async checkHealth(): Promise<{ online: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      // Consulta leve do IBGE de Curitiba (4106902)
      const url = `${this.BASE_URL}/rreo?an_exercicio=2024&nr_periodo=1&co_tipo_demonstrativo=RREO&co_poder=E&id_ente=4106902`;
      await this.fetchWithRetry(url, 1, 4000);
      return { online: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { online: false, latencyMs: Date.now() - start };
    }
  }
}
