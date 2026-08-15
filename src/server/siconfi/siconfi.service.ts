import { Injectable, Logger } from '@nestjs/common';
import { TenantInfo, getMunicipalSiconfiStatus } from '../municipalFiscalEngine';

@Injectable()
export class SiconfiService {
  private readonly logger = new Logger(SiconfiService.name);
  private cacheStore: Record<string, { data: any; timestamp: number }> = {};
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de cache

  async fetchSiconfi(endpoint: string, params: Record<string, string>) {
    const queryParams = new URLSearchParams(params).toString();
    const fullUrl = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/${endpoint}?${queryParams}`;
    const cacheKey = fullUrl;

    const cached = this.cacheStore[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { data: cached.data, fromCache: true, sourceUrl: fullUrl };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SGF-Fiscal-SaaS/4.0',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Siconfi API returned HTTP status ${response.status}`);
      }

      const jsonData = await response.json();
      this.cacheStore[cacheKey] = { data: jsonData, timestamp: Date.now() };
      return { data: jsonData, fromCache: false, sourceUrl: fullUrl };
    } catch (error: any) {
      this.logger.warn(`[Siconfi Fetch Warning] ${endpoint}: ${error.message}`);
      if (cached) {
        return { data: cached.data, fromCache: true, sourceUrl: fullUrl, isStale: true };
      }
      return { data: null, error: error.message, sourceUrl: fullUrl };
    }
  }

  async checkStatus(tenant: TenantInfo) {
    const startTime = Date.now();
    let online = false;
    let latencyMs = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const testUrl = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/entes?id_ente=${tenant.codigoIbge}`;
      const resp = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      latencyMs = Date.now() - startTime;
      online = resp.ok;
    } catch (err) {
      latencyMs = Date.now() - startTime;
      online = false;
    }

    return getMunicipalSiconfiStatus(tenant, latencyMs, online);
  }
}
