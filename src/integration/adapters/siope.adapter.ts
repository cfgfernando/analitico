import { Logger } from '@nestjs/common';
import { BaseIntegrationAdapter, AdapterSyncResult } from './adapter.interface';
import { FinancialCategory } from '@prisma/client';

export interface SiopeEducationData {
  municipio: string;
  codigoIbge: string;
  uf: string;
  exercicio: number;
  bimestre: number;
  receitaImpostosTransferencias: number;
  despesaTotalMdeLiquidada: number;
  percentualAplicacaoMde: number; // Piso mínimo constitucional = 25%
  pisoConstitucionalMdeAtingido: boolean;
  deficitOuSuperavitMde: number;
  fundebRecebido: number;
  fundebGastoMagisterio: number;
  percentualFundebMagisterio: number; // Piso mínimo = 70%
  pisoFundebAtingido: boolean;
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
 * 6.5 SIOPE Adapter — Sistema de Informações sobre Orçamentos Públicos em Educação
 * Fonte: FNDE / Ministério da Educação (MEC)
 * URLs oficiais:
 * - https://www.fnde.gov.br/siope/dadosInformadosMunicipio.do
 * - API OData (Dados Abertos): https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/
 */
export class SiopeAdapter implements BaseIntegrationAdapter<SiopeEducationData> {
  private readonly logger = new Logger(SiopeAdapter.name);
  readonly sourceName = 'SIOPE';
  readonly defaultEndpoint = 'https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata';

  /**
   * 1. FETCH: Realiza consulta à API OData com retry e timeout
   */
  async fetchData(codigoIbge: string, uf: string, exercicio = 2026): Promise<any> {
    const maxRetries = 2;
    const timeoutMs = 6000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // OData query filtrando por código IBGE do município
        const url = `${this.defaultEndpoint}/DespesasEducacaoMunicipio?$filter=CO_MUNICIPIO_IBGE%20eq%20'${codigoIbge}'%20and%20NU_ANO%20eq%20${exercicio}&$format=json`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SaaS-Fiscal-SIOPE-Adapter/4.0',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json && json.value && json.value.length > 0) {
            return json.value[0];
          }
        }
      } catch (err: any) {
        this.logger.warn(`[SIOPE Adapter] Tentativa ${attempt}/${maxRetries} falhou para IBGE ${codigoIbge}: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
        }
      }
    }

    return null;
  }

  /**
   * 2. NORMALIZE: Converte para modelo padronizado
   */
  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio: number): SiopeEducationData {
    if (!rawData) {
      return {
        municipio: '',
        codigoIbge,
        uf: '',
        exercicio,
        bimestre: 0,
        receitaImpostosTransferencias: 0,
        despesaTotalMdeLiquidada: 0,
        percentualAplicacaoMde: 0,
        pisoConstitucionalMdeAtingido: false,
        deficitOuSuperavitMde: 0,
        fundebRecebido: 0,
        fundebGastoMagisterio: 0,
        percentualFundebMagisterio: 0,
        pisoFundebAtingido: false,
        financialRecords: [],
      };
    }

    const receitaImpostos = Number(rawData.receitaImpostos || rawData.VL_RECEITA_IMPOSTOS || 0);
    const despesaMde = Number(rawData.despesaMde || rawData.VL_DESPESA_MDE || 0);
    const percentualMde = receitaImpostos > 0 ? Number(((despesaMde / receitaImpostos) * 100).toFixed(2)) : 0;
    const piso25 = receitaImpostos * 0.25;
    const deficitSuperavit = despesaMde - piso25;

    const fundebRecebido = Number(rawData.fundebRecebido || rawData.VL_FUNDEB_RECEBIDO || 0);
    const fundebMagisterio = Number(rawData.fundebMagisterio || rawData.VL_FUNDEB_MAGISTERIO || 0);
    const percentualFundeb = fundebRecebido > 0 ? Number(((fundebMagisterio / fundebRecebido) * 100).toFixed(2)) : 0;

    const financialRecords: SiopeEducationData['financialRecords'] = [];

    if (despesaMde > 0) {
      financialRecords.push({
        tenantId,
        sourceKey: 'SIOPE_EDUCACAO',
        exercicioAno: exercicio,
        periodo: String(rawData.bimestre || rawData.NU_BIMESTRE || '6B'),
        categoria: FinancialCategory.DESPESA,
        accountCode: 'MDE_APLICACAO_TOTAL',
        accountName: 'Aplicação em Manutenção e Desenvolvimento do Ensino (Art. 212 CF/88)',
        valor: despesaMde,
        dadosOrigemJson: JSON.stringify({ ...rawData, fonte: 'SIOPE/FNDE' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      });
    }

    if (fundebMagisterio > 0) {
      financialRecords.push({
        tenantId,
        sourceKey: 'SIOPE_EDUCACAO',
        exercicioAno: exercicio,
        periodo: String(rawData.bimestre || rawData.NU_BIMESTRE || '6B'),
        categoria: FinancialCategory.DESPESA,
        accountCode: 'FUNDEB_MAGISTERIO_70',
        accountName: 'Aplicação dos Recursos do FUNDEB na Remuneração dos Profissionais da Educação',
        valor: fundebMagisterio,
        dadosOrigemJson: JSON.stringify({ ...rawData, fonte: 'SIOPE/FNDE' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      });
    }

    return {
      municipio: rawData.municipio || rawData.NO_MUNICIPIO || 'Município',
      codigoIbge,
      uf: rawData.uf || rawData.SG_UF || 'PR',
      exercicio,
      bimestre: rawData.bimestre || rawData.NU_BIMESTRE || 6,
      receitaImpostosTransferencias: receitaImpostos,
      despesaTotalMdeLiquidada: despesaMde,
      percentualAplicacaoMde: percentualMde,
      pisoConstitucionalMdeAtingido: percentualMde >= 25.0,
      deficitOuSuperavitMde: deficitSuperavit,
      fundebRecebido,
      fundebGastoMagisterio: fundebMagisterio,
      percentualFundebMagisterio: percentualFundeb,
      pisoFundebAtingido: percentualFundeb >= 70.0,
      dataHomologacao: rawData.dataHomologacao || rawData.DT_HOMOLOGACAO,
      financialRecords,
    };
  }

  /**
   * 3. VALIDATE: Validação de integridade e limites legais
   */
  validateData(normalizedData: SiopeEducationData): { valid: boolean; errors: string[] } {
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
   * 4. SYNC TENANT: Pipeline de sincronização completo
   */
  async syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio = 2026): Promise<AdapterSyncResult<SiopeEducationData>> {
    const start = Date.now();
    try {
      const rawData = await this.fetchData(codigoIbge, uf, exercicio);
      const normalized = this.normalizeData(rawData, tenantId, codigoIbge, exercicio);
      const validation = this.validateData(normalized);

      return {
        success: Boolean(rawData) && validation.valid,
        tenantId,
        codigoIbge,
        source: 'SIOPE',
        sourceKey: 'SIOPE_EDUCACAO',
        recordsCount: normalized.financialRecords.length,
        data: normalized,
        rawResponse: rawData,
        errors: rawData ? validation.errors : ['Dados SIOPE não disponíveis para este município/exercício.'],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`[SIOPE Sync Error] ${err.message}`);
      const empty = this.normalizeData(null, tenantId, codigoIbge, exercicio);
      return {
        success: false,
        tenantId,
        codigoIbge,
        source: 'SIOPE',
        sourceKey: 'SIOPE_EDUCACAO',
        recordsCount: 0,
        data: empty,
        errors: [err.message],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
