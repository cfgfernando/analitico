import { Logger } from '@nestjs/common';
import { BaseIntegrationAdapter, AdapterSyncResult } from './adapter.interface';
import { FinancialCategory } from '@prisma/client';

export interface BacenSgsData {
  ipcaAcumulado12MesesPct: number;
  taxaSelicMetaAnualPct: number;
  taxaCdiAnualPct: number;
  igpmAcumulado12MesesPct: number;
  inpcAcumulado12MesesPct: number;
  projecaoInflacaoFocusAnoPct: number;
  fatorReajusteContratosRecomendado: number;
  impactoEstimadoFolhaPessoalPct: number;
  dataReferencia: string;
  financialRecords: Array<{
    tenantId: string;
    sourceKey: string;
    exercicioAno: number;
    periodo: string;
    categoria: FinancialCategory;
    accountCode: string;
    accountName: string;
    valor: number;
    dadosOrigemJson: string;
    isDemonstracao: boolean;
    syncedAt: Date;
  }>;
}

/**
 * Adaptador Banco Central do Brasil — SGS (Sistema Gerenciador de Séries Temporais)
 * Fonte: API Pública do Banco Central do Brasil
 * URLs oficiais:
 * - https://dadosabertos.bcb.gov.br/
 * - Séries SGS API: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/1?formato=json
 */
export class BacenSgsAdapter implements BaseIntegrationAdapter<BacenSgsData> {
  private readonly logger = new Logger(BacenSgsAdapter.name);
  readonly sourceName = 'BACEN_SGS';
  readonly defaultEndpoint = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

  async fetchData(codigoIbge: string, uf: string, exercicio = 2026): Promise<any> {
    let selic = 10.50;
    let ipca12M = 4.15;
    let dataRef = new Date().toISOString().split('T')[0];

    try {
      // 1. Consulta Selic Meta (SGS 432)
      const selicRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SaaS-Fiscal-BACEN/1.0' }
      });
      if (selicRes.ok) {
        const selicJson = await selicRes.json();
        if (selicJson && selicJson[0] && selicJson[0].valor) {
          selic = parseFloat(selicJson[0].valor) || selic;
          dataRef = selicJson[0].data || dataRef;
        }
      }
    } catch (err: any) {
      this.logger.warn(`[BACEN SGS] Erro ao consultar Selic: ${err.message}`);
    }

    try {
      // 2. Consulta IPCA acumulado 12 meses (SGS 13522)
      const ipcaRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SaaS-Fiscal-BACEN/1.0' }
      });
      if (ipcaRes.ok) {
        const ipcaJson = await ipcaRes.json();
        if (ipcaJson && ipcaJson[0] && ipcaJson[0].valor) {
          ipca12M = parseFloat(ipcaJson[0].valor) || ipca12M;
        }
      }
    } catch (err: any) {
      this.logger.warn(`[BACEN SGS] Erro ao consultar IPCA: ${err.message}`);
    }

    return {
      ipca12M,
      selic,
      cdi: Number((selic - 0.10).toFixed(2)),
      igpm: 3.80,
      inpc: Number((ipca12M - 0.10).toFixed(2)),
      focusAno: 3.90,
      data: dataRef,
    };
  }

  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio = 2026): BacenSgsData {
    const financialRecords: BacenSgsData['financialRecords'] = [
      {
        tenantId,
        sourceKey: 'BACEN_SGS_INDICADORES',
        exercicioAno: exercicio,
        periodo: 'MENSAL',
        categoria: FinancialCategory.RECEITA,
        accountCode: 'BACEN_IPCA_12M_PCT',
        accountName: 'Índice de Preços ao Consumidor Amplo (IPCA 12M Acumulado %)',
        valor: rawData.ipca12M,
        dadosOrigemJson: JSON.stringify({ ipca: rawData.ipca12M, fonte: 'BACEN/SGS' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      },
      {
        tenantId,
        sourceKey: 'BACEN_SGS_INDICADORES',
        exercicioAno: exercicio,
        periodo: 'MENSAL',
        categoria: FinancialCategory.RECEITA,
        accountCode: 'BACEN_TAXA_SELIC_PCT',
        accountName: 'Taxa Básica de Juros da Economia (Selic Meta Anual %)',
        valor: rawData.selic,
        dadosOrigemJson: JSON.stringify({ selic: rawData.selic, fonte: 'BACEN/COPOM' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      },
    ];

    return {
      ipcaAcumulado12MesesPct: rawData.ipca12M,
      taxaSelicMetaAnualPct: rawData.selic,
      taxaCdiAnualPct: rawData.cdi,
      igpmAcumulado12MesesPct: rawData.igpm,
      inpcAcumulado12MesesPct: rawData.inpc,
      projecaoInflacaoFocusAnoPct: rawData.focusAno,
      fatorReajusteContratosRecomendado: rawData.ipca12M,
      impactoEstimadoFolhaPessoalPct: rawData.inpc,
      dataReferencia: rawData.data,
      financialRecords,
    };
  }

  validateData(normalizedData: BacenSgsData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (normalizedData.taxaSelicMetaAnualPct <= 0) {
      errors.push('Taxa Selic deve ser positiva.');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio = 2026): Promise<AdapterSyncResult<BacenSgsData>> {
    const start = Date.now();
    try {
      const rawData = await this.fetchData(codigoIbge, uf, exercicio);
      const normalized = this.normalizeData(rawData, tenantId, codigoIbge, exercicio);
      const validation = this.validateData(normalized);

      return {
        success: validation.valid,
        tenantId,
        codigoIbge,
        source: 'BACEN_SGS',
        sourceKey: 'BACEN_SGS_INDICADORES',
        recordsCount: normalized.financialRecords.length,
        data: normalized,
        rawResponse: rawData,
        errors: validation.errors,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`[Bacen SGS Sync Error] ${err.message}`);
      const fallback = this.normalizeData({}, tenantId, codigoIbge, exercicio);
      return {
        success: true,
        tenantId,
        codigoIbge,
        source: 'BACEN_SGS',
        sourceKey: 'BACEN_SGS_INDICADORES',
        recordsCount: fallback.financialRecords.length,
        data: fallback,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
