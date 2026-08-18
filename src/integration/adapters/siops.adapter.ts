import { Logger } from '@nestjs/common';
import { BaseIntegrationAdapter, AdapterSyncResult } from './adapter.interface';
import { FinancialCategory } from '@prisma/client';

export interface SiopsHealthData {
  municipio: string;
  codigoIbge: string;
  uf: string;
  exercicio: number;
  bimestre: number;
  receitaImpostosTransferencias: number;
  despesaPropriaSaudeLiquidata: number;
  percentualAplicacaoSaude: number; // Piso mínimo constitucional = 15%
  pisoConstitucionalAtingido: boolean;
  deficitOuSuperavitPiso: number;
  recursosSusTransferidos: number;
  despesaTotalSaude: number;
  dataHomologacao?: string;
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
 * 6.4 SIOPS Adapter — Sistema de Informações sobre Orçamentos Públicos em Saúde
 * Fonte: Ministério da Saúde / FNS / DATASUS
 * URLs oficiais:
 * - http://siops.datasus.gov.br/consvaloresmunicipio.php
 * - https://portalfns.saude.gov.br/siops/
 * - dados.gov.br (Conjunto "SIOPS")
 */
export class SiopsAdapter implements BaseIntegrationAdapter<SiopsHealthData> {
  private readonly logger = new Logger(SiopsAdapter.name);
  readonly sourceName = 'SIOPS';
  readonly defaultEndpoint = 'https://portalfns.saude.gov.br/api/siops';

  /**
   * 1. FETCH: Realiza requisição com retry exponencial e timeout
   */
  async fetchData(codigoIbge: string, uf: string, exercicio = 2026): Promise<any> {
    const maxRetries = 2;
    const timeoutMs = 6000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const url = `${this.defaultEndpoint}/relatorio-saude?ibge=${codigoIbge}&ano=${exercicio}&uf=${uf}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SaaS-Fiscal-SIOPS-Adapter/4.0',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json();
        }
      } catch (err: any) {
        this.logger.warn(`[SIOPS Adapter] Tentativa ${attempt}/${maxRetries} falhou para IBGE ${codigoIbge}: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
        }
      }
    }

    return null;
  }

  /**
   * 2. NORMALIZE: Transforma payload bruto em modelo unificado
   */
  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio: number): SiopsHealthData {
    if (!rawData) {
      return {
        municipio: '',
        codigoIbge,
        uf: '',
        exercicio,
        bimestre: 0,
        receitaImpostosTransferencias: 0,
        despesaPropriaSaudeLiquidata: 0,
        percentualAplicacaoSaude: 0,
        pisoConstitucionalAtingido: false,
        deficitOuSuperavitPiso: 0,
        recursosSusTransferidos: 0,
        despesaTotalSaude: 0,
        financialRecords: [],
      };
    }

    const receitaImpostos = Number(rawData.receitaImpostosTransferencias || rawData.receitaImpostos || 0);
    const despesaPropria = Number(rawData.despesaPropriaSaudeLiquidata || rawData.despesaPropria || 0);
    const percentual = receitaImpostos > 0 ? Number(((despesaPropria / receitaImpostos) * 100).toFixed(2)) : 0;
    const piso15 = receitaImpostos * 0.15;
    const deficitSuperavit = despesaPropria - piso15;

    const financialRecords: SiopsHealthData['financialRecords'] = [];

    if (despesaPropria > 0) {
      financialRecords.push({
        tenantId,
        sourceKey: 'SIOPS_SAUDE',
        exercicioAno: exercicio,
        periodo: String(rawData.bimestre || '6B'),
        categoria: FinancialCategory.DESPESA,
        accountCode: 'ASPS_PROPRIA_TOTAL',
        accountName: 'Despesa Própria com Ações e Serviços Públicos de Saúde (ASPS)',
        valor: despesaPropria,
        dadosOrigemJson: JSON.stringify({ ...rawData, fonte: 'SIOPS/MS' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      });
    }

    if (receitaImpostos > 0) {
      financialRecords.push({
        tenantId,
        sourceKey: 'SIOPS_SAUDE',
        exercicioAno: exercicio,
        periodo: String(rawData.bimestre || '6B'),
        categoria: FinancialCategory.RECEITA,
        accountCode: 'BASE_CALCULO_SAUDE_15',
        accountName: 'Base de Cálculo Constitucional da Saúde (Art. 198 CF/88)',
        valor: receitaImpostos,
        dadosOrigemJson: JSON.stringify({ ...rawData, fonte: 'SIOPS/MS' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      });
    }

    return {
      municipio: rawData.municipio || 'Município',
      codigoIbge,
      uf: rawData.uf || 'PR',
      exercicio,
      bimestre: rawData.bimestre || 6,
      receitaImpostosTransferencias: receitaImpostos,
      despesaPropriaSaudeLiquidata: despesaPropria,
      percentualAplicacaoSaude: percentual,
      pisoConstitucionalAtingido: percentual >= 15.0,
      deficitOuSuperavitPiso: deficitSuperavit,
      recursosSusTransferidos: Number(rawData.recursosSusTransferidos || 0),
      despesaTotalSaude: Number(rawData.despesaTotalSaude || despesaPropria),
      dataHomologacao: rawData.dataHomologacao,
      financialRecords,
    };
  }

  /**
   * 3. VALIDATE: Verifica consistência contábil e limites
   */
  validateData(normalizedData: SiopsHealthData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!normalizedData.codigoIbge || normalizedData.codigoIbge.length !== 7) {
      errors.push('Código IBGE inválido (deve possuir 7 dígitos).');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 4. SYNC TENANT: Orquestrador ponta a ponta
   */
  async syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio = 2026): Promise<AdapterSyncResult<SiopsHealthData>> {
    const start = Date.now();
    try {
      const rawData = await this.fetchData(codigoIbge, uf, exercicio);
      const normalized = this.normalizeData(rawData, tenantId, codigoIbge, exercicio);
      const validation = this.validateData(normalized);

      return {
        success: Boolean(rawData) && validation.valid,
        tenantId,
        codigoIbge,
        source: 'SIOPS',
        sourceKey: 'SIOPS_SAUDE',
        recordsCount: normalized.financialRecords.length,
        data: normalized,
        rawResponse: rawData,
        errors: rawData ? validation.errors : ['Dados SIOPS não disponíveis para este município/exercício.'],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`[SIOPS Sync Error] ${err.message}`);
      const empty = this.normalizeData(null, tenantId, codigoIbge, exercicio);
      return {
        success: false,
        tenantId,
        codigoIbge,
        source: 'SIOPS',
        sourceKey: 'SIOPS_SAUDE',
        recordsCount: 0,
        data: empty,
        errors: [err.message],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
