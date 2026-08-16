/**
 * Base Adapter Interface for Government Data Integrations
 */

export interface AdapterSyncResult<T = any> {
  success: boolean;
  tenantId: string;
  codigoIbge: string;
  source: string;
  sourceKey: string;
  recordsCount: number;
  data: T;
  rawResponse?: any;
  errors?: string[];
  latencyMs: number;
  timestamp: string;
}

export interface BaseIntegrationAdapter<T = any> {
  readonly sourceName: string;
  readonly defaultEndpoint: string;

  fetchData(codigoIbge: string, uf: string, exercicio?: number): Promise<any>;
  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio: number): T;
  validateData(normalizedData: T): { valid: boolean; errors: string[] };
  syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio?: number): Promise<AdapterSyncResult<T>>;
}
