import { Logger } from '@nestjs/common';
import { BaseIntegrationAdapter, AdapterSyncResult } from './adapter.interface';
import { FinancialCategory } from '@prisma/client';

export interface NovoPacProjetoItem {
  id: string;
  codigoChamada: string;
  eixo: string; // Ex: 'Saúde', 'Educação', 'Cidades Sustentáveis', 'Segurança (FNSP)'
  ministerioConcedente: string;
  titulo: string;
  objeto: string;
  valorPrevisto: number;
  situacaoProposta: 'SELECIONADA' | 'EM_ANALISE_CAIXA' | 'CONVÊNIO_CELEBRADO' | 'CHAMADA_ABERTA';
  dataLimiteInscricao?: string;
  linkOficial: string;
}

export interface NovoPacData {
  municipio: string;
  codigoIbge: string;
  exercicio: number;
  totalProjetosSelecionados: number;
  valorTotalProjetosSelecionadosReais: number;
  chamadasAbertasDisponiveis: number;
  eixosAtendidos: string[];
  projetos: NovoPacProjetoItem[];
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
 * Adaptador Novo PAC / FNSP / Chamadas Ministeriais
 * Fonte: Casa Civil / Ministério do Planejamento / Ministério da Justiça (FNSP)
 * URLs oficiais:
 * - https://www.gov.br/casacivil/pt-br/novopac
 * - Transferegov / Obrasgov: https://transferegov.sistema.gov.br/
 */
export class NovoPacAdapter implements BaseIntegrationAdapter<NovoPacData> {
  private readonly logger = new Logger(NovoPacAdapter.name);
  readonly sourceName = 'NOVO_PAC_MINISTERIOS';
  readonly defaultEndpoint = 'https://api.novopac.gov.br';

  async fetchData(codigoIbge: string, uf: string, exercicio = 2026): Promise<any> {
    const cleanIbge = (codigoIbge || '').replace(/\D/g, '');
    try {
      // Consulta transferências e parcerias de obras e investimentos do governo federal
      const res = await fetch(`http://api-publica.transferegov.gestao.gov.br/api/v1/convenios?municipio_ibge=${cleanIbge}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SaaS-Fiscal-NovoPAC/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        const projetos: NovoPacProjetoItem[] = items.map((item: any, idx: number) => ({
          id: item.numero || item.id || `pac-${idx}`,
          codigoChamada: item.numeroConvenio || item.numeroProposta || `PAC-${exercicio}/${idx + 1}`,
          eixo: item.subfuncao || item.area || 'Infraestrutura Urbana',
          ministerioConcedente: item.orgaoConcedente || item.ministerio || 'Governo Federal',
          titulo: item.objeto || 'Empreendimento Federal',
          objeto: item.objeto || 'Sem descrição cadastrada',
          valorPrevisto: Number(item.valorGlobal || item.valorRepasse || 0),
          situacaoProposta: 'CONVÊNIO_CELEBRADO',
          linkOficial: 'http://api-publica.transferegov.gestao.gov.br',
        }));

        return {
          codigoIbge: cleanIbge,
          projetos,
          totalProjetos: projetos.length,
          valorTotal: projetos.reduce((acc, p) => acc + p.valorPrevisto, 0),
        };
      }
    } catch (err: any) {
      this.logger.warn(`[Novo PAC Adapter] Erro ao consultar dados abertos: ${err.message}`);
    }

    return {
      codigoIbge: cleanIbge,
      projetos: [],
      totalProjetos: 0,
      valorTotal: 0,
    };
  }

  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio = 2026): NovoPacData {
    const projetos: NovoPacProjetoItem[] = rawData?.projetos || [];
    const valorTotal = projetos.reduce((acc, p) => acc + p.valorPrevisto, 0);

    const financialRecords: NovoPacData['financialRecords'] = [];

    if (valorTotal > 0) {
      financialRecords.push({
        tenantId,
        sourceKey: 'NOVO_PAC_INVESTIMENTOS',
        exercicioAno: exercicio,
        periodo: 'ANUAL',
        categoria: FinancialCategory.RECEITA,
        accountCode: 'PAC_INVESTIMENTOS_SELECIONADOS',
        accountName: 'Volume Financeiro de Empreendimentos Selecionados no Novo PAC / Parcerias',
        valor: valorTotal,
        dadosOrigemJson: JSON.stringify({ totalProjetos: projetos.length, fonte: 'Transferegov/Novo PAC' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      });
    }

    return {
      municipio: rawData?.municipio || 'Município',
      codigoIbge,
      exercicio,
      totalProjetosSelecionados: projetos.filter(p => p.situacaoProposta === 'SELECIONADA' || p.situacaoProposta === 'CONVÊNIO_CELEBRADO').length,
      valorTotalProjetosSelecionadosReais: valorTotal,
      chamadasAbertasDisponiveis: projetos.filter(p => p.situacaoProposta === 'CHAMADA_ABERTA').length,
      eixosAtendidos: ['Infraestrutura Urbana', 'Saúde', 'Educação'],
      projetos,
      ultimaConsulta: new Date().toISOString(),
      financialRecords,
    };
  }

  validateData(normalizedData: NovoPacData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!normalizedData.codigoIbge || normalizedData.codigoIbge.length !== 7) {
      errors.push('Código IBGE inválido.');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async syncTenant(tenantId: string, codigoIbge: string, uf: string, exercicio = 2026): Promise<AdapterSyncResult<NovoPacData>> {
    const start = Date.now();
    try {
      const rawData = await this.fetchData(codigoIbge, uf, exercicio);
      const normalized = this.normalizeData(rawData, tenantId, codigoIbge, exercicio);
      const validation = this.validateData(normalized);

      return {
        success: validation.valid,
        tenantId,
        codigoIbge,
        source: 'NOVO_PAC',
        sourceKey: 'NOVO_PAC_INVESTIMENTOS',
        recordsCount: normalized.financialRecords.length,
        data: normalized,
        rawResponse: rawData,
        errors: validation.errors,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`[Novo PAC Sync Error] ${err.message}`);
      const empty = this.normalizeData(null, tenantId, codigoIbge, exercicio);
      return {
        success: false,
        tenantId,
        codigoIbge,
        source: 'NOVO_PAC',
        sourceKey: 'NOVO_PAC_INVESTIMENTOS',
        recordsCount: 0,
        data: empty,
        errors: [err.message],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
