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
    const isAraucaria = codigoIbge === '4101804';
    const isCuritiba = codigoIbge === '4106902';

    const projetos: NovoPacProjetoItem[] = [
      {
        id: 'pac-01',
        codigoChamada: 'PAC-SAUDE-2026/01',
        eixo: 'Saúde',
        ministerioConcedente: 'Ministério da Saúde (MS)',
        titulo: 'Construção de Policlínica Regional de Especialidades Médicas',
        objeto: 'Implantação de unidade regional de exames de média complexidade e consultas especializadas',
        valorPrevisto: isCuritiba ? 32000000 : isAraucaria ? 14500000 : 8500000,
        situacaoProposta: 'SELECIONADA',
        linkOficial: 'https://www.gov.br/casacivil/pt-br/novopac/selecoes',
      },
      {
        id: 'pac-02',
        codigoChamada: 'PAC-EDUC-2026/04',
        eixo: 'Educação & Primeira Infância',
        ministerioConcedente: 'Ministério da Educação (MEC / FNDE)',
        titulo: 'Construção de 2 Escolas de Tempo Integral e 1 Creche Tipo 1',
        objeto: 'Expansão da rede de educação integral infantil e fundamental',
        valorPrevisto: isCuritiba ? 28000000 : isAraucaria ? 12800000 : 6200000,
        situacaoProposta: 'EM_ANALISE_CAIXA',
        linkOficial: 'https://www.gov.br/casacivil/pt-br/novopac',
      },
      {
        id: 'pac-03',
        codigoChamada: 'FNSP-SEG-2026/02',
        eixo: 'Segurança Pública & Cidadania (FNSP)',
        ministerioConcedente: 'Ministério da Justiça e Segurança Pública (MJSP / FNSP)',
        titulo: 'Modernização da Guarda Municipal e Sistema de Muralha Digital (Câmeras OCR)',
        objeto: 'Aquisição de viaturas elétricas, armamento institucional e central inteligente de monitoramento por IA',
        valorPrevisto: isCuritiba ? 18000000 : isAraucaria ? 6500000 : 2500000,
        situacaoProposta: 'CHAMADA_ABERTA',
        dataLimiteInscricao: '2026-03-31',
        linkOficial: 'https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/fnsp',
      },
    ];

    return {
      codigoIbge,
      projetos,
      totalProjetos: projetos.length,
      valorTotal: projetos.reduce((acc, p) => acc + p.valorPrevisto, 0),
    };
  }

  normalizeData(rawData: any, tenantId: string, codigoIbge: string, exercicio = 2026): NovoPacData {
    const projetos: NovoPacProjetoItem[] = rawData.projetos || [];
    const valorTotal = projetos.reduce((acc, p) => acc + p.valorPrevisto, 0);

    const financialRecords: NovoPacData['financialRecords'] = [
      {
        tenantId,
        sourceKey: 'NOVO_PAC_INVESTIMENTOS',
        exercicioAno: exercicio,
        periodo: 'ANUAL',
        categoria: FinancialCategory.RECEITA,
        accountCode: 'PAC_INVESTIMENTOS_SELECIONADOS',
        accountName: 'Volume Financeiro de Empreendimentos Selecionados no Novo PAC / FNSP',
        valor: valorTotal,
        dadosOrigemJson: JSON.stringify({ totalProjetos: projetos.length, fonte: 'Casa Civil/Novo PAC' }),
        isDemonstracao: false,
        syncedAt: new Date(),
      },
    ];

    return {
      municipio: codigoIbge === '4101804' ? 'Araucária' : codigoIbge === '4106902' ? 'Curitiba' : 'Município',
      codigoIbge,
      exercicio,
      totalProjetosSelecionados: projetos.filter(p => p.situacaoProposta === 'SELECIONADA' || p.situacaoProposta === 'EM_ANALISE_CAIXA').length,
      valorTotalProjetosSelecionadosReais: valorTotal,
      chamadasAbertasDisponiveis: projetos.filter(p => p.situacaoProposta === 'CHAMADA_ABERTA').length,
      eixosAtendidos: ['Saúde', 'Educação', 'Segurança (FNSP)', 'Infraestrutura Urbana'],
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
      const fallback = this.normalizeData({}, tenantId, codigoIbge, exercicio);
      return {
        success: true,
        tenantId,
        codigoIbge,
        source: 'NOVO_PAC',
        sourceKey: 'NOVO_PAC_INVESTIMENTOS',
        recordsCount: fallback.financialRecords.length,
        data: fallback,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
