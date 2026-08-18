import { Logger } from '@nestjs/common';
import { BaseIntegrationAdapter, AdapterSyncResult } from './adapter.interface';
import { FinancialCategory } from '@prisma/client';

export interface CaucItemRequirement {
  codigo: string;          // Ex: '1.1', '1.2', '2.1', '3.1'
  descricao: string;       // Ex: 'Tributos e Contribuições Federais'
  grupo: 'OBRIGACOES_FINANCEIRAS' | 'PRESTACAO_CONTAS' | 'TRANSPARENCIA' | 'LIMITES_CONSTITUCIONAIS';
  situacao: 'REGULAR' | 'RESTRICAO' | 'ISENTO' | 'EM_ANALISE';
  orgaoResponsavel: string; // Ex: 'PGFN / RFB', 'Caixa Econômica', 'STN', 'TCE'
  dataValidade?: string;
  detalheInconsistencia?: string;
}

export interface CaucStatusData {
  municipio: string;
  codigoIbge: string;
  cnpj: string;
  uf: string;
  statusGeral: 'ADIMPLENTE' | 'INADIMPLENTE_COM_RESTRICOES';
  totalRequisitos: number;
  totalRegulares: number;
  totalRestricoes: number;
  podeReceberTransferenciasVoluntarias: boolean;
  podeReceberEmendasParlamentares: boolean;
  valorPotencialBloqueadoReais: number;
  alertaBloqueioTexto: string;
  requisitos: CaucItemRequirement[];
  ultimaConsulta: string;
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
 * 6.6 CAUC Adapter — Sistema de Informações sobre Requisitos Fiscais
 * Fonte: Secretaria do Tesouro Nacional (STN) / Plataforma +Brasil / Tesouro Transparente (CKAN)
 * URLs oficiais:
 * - https://cauc.tesouro.gov.br/
 * - Dados Abertos CKAN: https://www.tesourotransparente.gov.br/ckan/dataset/cauc
 */
export class CaucAdapter implements BaseIntegrationAdapter<CaucStatusData> {
  private readonly logger = new Logger(CaucAdapter.name);
  readonly sourceName = 'CAUC';
  readonly defaultEndpoint = 'https://www.tesourotransparente.gov.br/ckan/api/3/action';

  /**
   * 1. FETCH: Consulta situação no CAUC / Tesouro Transparente CKAN
   */
  async fetchData(codigoIbge: string, uf: string, exercicio = 2026): Promise<any> {
    const maxRetries = 2;
    const timeoutMs = 6000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const url = `${this.defaultEndpoint}/datastore_search?resource_id=cauc_municipios&q=${codigoIbge}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SaaS-Fiscal-CAUC-Adapter/4.0',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json && json.result && json.result.records && json.result.records.length > 0) {
            return json.result.records[0];
          }
        }
      } catch (err: any) {
        this.logger.warn(`[CAUC Adapter] Tentativa ${attempt}/${maxRetries} falhou para IBGE ${codigoIbge}: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
        }
      }
    }

    return null;
  }

  /**
   * 2. NORMALIZE: Transforma requisitos do CAUC em objeto estruturado
   */
  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio = 2026): CaucStatusData {
    if (!rawData) {
      return {
        municipio: '',
        codigoIbge,
        cnpj: '',
        uf: '',
        statusGeral: 'ADIMPLENTE',
        totalRequisitos: 0,
        totalRegulares: 0,
        totalRestricoes: 0,
        podeReceberTransferenciasVoluntarias: true,
        podeReceberEmendasParlamentares: true,
        valorPotencialBloqueadoReais: 0,
        alertaBloqueioTexto: 'Aguardando sincronização de dados do CAUC/STN.',
        requisitos: [],
        ultimaConsulta: new Date().toISOString(),
        financialRecords: [],
      };
    }

    const requisitos: CaucItemRequirement[] = rawData.requisitos || [];
    const totalRestricoes = requisitos.filter(r => r.situacao === 'RESTRICAO').length;
    const totalRegulares = requisitos.filter(r => r.situacao === 'REGULAR').length;
    const isAdimplente = totalRestricoes === 0;

    const valorBloqueado = isAdimplente ? 0 : 0;
    const alertaTexto = isAdimplente
      ? 'Município plenamente ADIMPLENTE no CAUC. Apto a receber transferências voluntárias e emendas.'
      : `ATENÇÃO: Município possui ${totalRestricoes} restrição(ões) ativa(s) no CAUC.`;

    const financialRecords: CaucStatusData['financialRecords'] = [
      {
        tenantId,
        sourceKey: 'CAUC_STN',
        exercicioAno: exercicio,
        periodo: 'DIARIO',
        categoria: FinancialCategory.RGF,
        accountCode: 'CAUC_STATUS_ADIMPLENCIA',
        accountName: 'Status de Regularidade Fiscal Municipal no CAUC/STN',
        valor: isAdimplente ? 1.0 : 0.0,
        dadosOrigemJson: JSON.stringify({
          status: isAdimplente ? 'ADIMPLENTE' : 'INADIMPLENTE',
          totalRestricoes,
          requisitos,
          fonte: 'CAUC/STN',
        }),
        isDemonstracao: false,
        syncedAt: new Date(),
      },
    ];

    return {
      municipio: rawData.municipio || rawData.ente || 'Município',
      codigoIbge,
      cnpj: rawData.cnpj || '',
      uf: rawData.uf || 'PR',
      statusGeral: isAdimplente ? 'ADIMPLENTE' : 'INADIMPLENTE_COM_RESTRICOES',
      totalRequisitos: requisitos.length,
      totalRegulares,
      totalRestricoes,
      podeReceberTransferenciasVoluntarias: isAdimplente,
      podeReceberEmendasParlamentares: isAdimplente,
      valorPotencialBloqueadoReais: valorBloqueado,
      alertaBloqueioTexto: alertaTexto,
      requisitos,
      ultimaConsulta: new Date().toISOString(),
      financialRecords,
    };
  }

  /**
   * 3. VALIDATE: Verifica se todos os itens de conformidade foram avaliados
   */
  validateData(normalizedData: CaucStatusData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!normalizedData.codigoIbge || normalizedData.codigoIbge.length !== 7) {
      errors.push('Código IBGE inválido para consulta do CAUC.');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 4. SYNC TENANT: Orquestrador de consulta ao CAUC
   */
  async syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio = 2026): Promise<AdapterSyncResult<CaucStatusData>> {
    const start = Date.now();
    try {
      const rawData = await this.fetchData(codigoIbge, uf, exercicio);
      const normalized = this.normalizeData(rawData, tenantId, codigoIbge, exercicio);
      const validation = this.validateData(normalized);

      return {
        success: Boolean(rawData) && validation.valid,
        tenantId,
        codigoIbge,
        source: 'CAUC',
        sourceKey: 'CAUC_STN',
        recordsCount: normalized.financialRecords.length,
        data: normalized,
        rawResponse: rawData,
        errors: rawData ? validation.errors : ['Dados do CAUC não disponíveis para este município/exercício.'],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`[CAUC Sync Error] ${err.message}`);
      const empty = this.normalizeData(null, tenantId, codigoIbge, exercicio);
      return {
        success: false,
        tenantId,
        codigoIbge,
        source: 'CAUC',
        sourceKey: 'CAUC_STN',
        recordsCount: 0,
        data: empty,
        errors: [err.message],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
