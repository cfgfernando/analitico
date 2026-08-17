import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Fase 4 — DataProvenanceService
 *
 * Centraliza o controle de rastreabilidade de dados:
 * - Registra cada sincronização com API governamental em `sync_logs`
 * - Rastreia a origem de cada dado (OFICIAL vs ESTIMATIVA)
 * - Expõe o status de todas as fontes para o frontend
 */

export type DataOrigin = 'OFICIAL' | 'DEMONSTRACAO';
export type SyncStatus = 'success' | 'error' | 'pending' | 'partial';

export interface DataSourceStatus {
  provider: string;           // Ex: 'SICONFI', 'TRANSFEREGOV', 'TCE_PR'
  label: string;              // Ex: 'SICONFI / Tesouro Nacional'
  origin: DataOrigin;
  source: string;             // Descrição da fonte
  confidence: string;
  lastSync: string | null;    // ISO date da última sincronia
  lastSyncStatus: SyncStatus;
  totalRecords: number;
  url?: string;
  anexo?: string;
}

@Injectable()
export class DataProvenanceService {
  private readonly logger = new Logger(DataProvenanceService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Registra uma sincronização no banco de dados.
   * Chamado por SiconfiSyncService, TransferegovService, etc.
   */
  async recordSync(params: {
    tenantId: string;
    provider: string;
    status: SyncStatus;
    recordsIngested?: number;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.prisma.isDbConnected()) return;

    try {
      await this.prisma.syncLog.create({
        data: {
          tenantId: params.tenantId,
          sourceKey: params.provider,
          status: (params.status as string) === 'success' || (params.status as string) === 'SUCESSO' ? 'SUCESSO'
            : (params.status as string) === 'error' || (params.status as string) === 'ERRO' ? 'ERRO'
            : 'PENDENTE',
          recordsImported: params.recordsIngested ?? 0,
          errorMessage: params.errorMessage ?? null,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });

      this.logger.log(
        `[Provenance] ${params.provider} | tenant=${params.tenantId} | status=${params.status} | records=${params.recordsIngested ?? 0}`,
      );
    } catch (err: any) {
      this.logger.warn(`[Provenance] Falha ao registrar sync: ${err.message}`);
    }
  }

  /**
   * Retorna o histórico de sincronizações de um tenant.
   */
  async getSyncHistory(tenantId: string, limit = 20) {
    if (!this.prisma.isDbConnected()) return [];

    try {
      return await this.prisma.syncLog.findMany({
        where: { tenantId },
        orderBy: { startedAt: 'desc' },
        take: limit,
      });
    } catch {
      return [];
    }
  }

  /**
   * Retorna o status atual de todas as fontes de dados de um tenant.
   */
  async getSourcesStatus(tenantId: string): Promise<DataSourceStatus[]> {
    const allLogs = await this.getSyncHistory(tenantId, 100);

    // Agrupa por provider e pega o mais recente
    const byProvider = new Map<string, any>();
    for (const log of allLogs) {
      if (!byProvider.has(log.sourceKey)) {
        byProvider.set(log.sourceKey, log);
      }
    }

    const sources: DataSourceStatus[] = [
      {
        provider: 'SICONFI',
        label: 'SICONFI / Tesouro Nacional (STN)',
        origin: byProvider.has('SICONFI') ? 'OFICIAL' : 'DEMONSTRACAO',
        source: 'API SICONFI — Secretaria do Tesouro Nacional',
        confidence: byProvider.has('SICONFI') ? 'OFICIAL_HOMOLOGADO' : 'ESTIMATIVA_ALTA_CONFIANCA',
        lastSync: byProvider.get('SICONFI')?.startedAt?.toISOString() ?? null,
        lastSyncStatus: this._mapStatus(byProvider.get('SICONFI')?.status),
        totalRecords: byProvider.get('SICONFI')?.recordsImported ?? 0,
        url: 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt',
        anexo: 'RREO / RGF',
      },
      {
        provider: 'TRANSFEREGOV',
        label: 'Transferegov / MPTO',
        origin: byProvider.has('TRANSFEREGOV') ? 'OFICIAL' : 'DEMONSTRACAO',
        source: 'API Transferegov — Ministério do Planejamento',
        confidence: byProvider.has('TRANSFEREGOV') ? 'OFICIAL_HOMOLOGADO' : 'ESTIMATIVA_ALTA_CONFIANCA',
        lastSync: byProvider.get('TRANSFEREGOV')?.startedAt?.toISOString() ?? null,
        lastSyncStatus: this._mapStatus(byProvider.get('TRANSFEREGOV')?.status),
        totalRecords: byProvider.get('TRANSFEREGOV')?.recordsImported ?? 0,
        url: 'https://transferegov.sistema.gov.br',
      },
      {
        provider: 'TCE_PR',
        label: 'TCE-PR — Tribunal de Contas do Paraná',
        origin: byProvider.has('TCE_PR') ? 'OFICIAL' : 'DEMONSTRACAO',
        source: 'CAp Fiscal TCE-PR',
        confidence: byProvider.has('TCE_PR') ? 'OFICIAL_HOMOLOGADO' : 'ESTIMATIVA_ALTA_CONFIANCA',
        lastSync: byProvider.get('TCE_PR')?.syncedAt?.toISOString() ?? null,
        lastSyncStatus: this._mapStatus(byProvider.get('TCE_PR')?.status),
        totalRecords: byProvider.get('TCE_PR')?.recordsIngested ?? 0,
        url: 'https://www1.tce.pr.gov.br/conteudo/capfiscal',
      },
      {
        provider: 'PORTAL_TRANSPARENCIA',
        label: 'Portal da Transparência / CGU',
        origin: byProvider.has('PORTAL_TRANSPARENCIA') ? 'OFICIAL' : 'DEMONSTRACAO',
        source: 'API Portal Transparência — Controladoria Geral da União',
        confidence: byProvider.has('PORTAL_TRANSPARENCIA') ? 'OFICIAL_HOMOLOGADO' : 'ESTIMATIVA_ALTA_CONFIANCA',
        lastSync: byProvider.get('PORTAL_TRANSPARENCIA')?.syncedAt?.toISOString() ?? null,
        lastSyncStatus: this._mapStatus(byProvider.get('PORTAL_TRANSPARENCIA')?.status),
        totalRecords: byProvider.get('PORTAL_TRANSPARENCIA')?.recordsIngested ?? 0,
        url: 'https://api.portaldatransparencia.gov.br',
      },
      {
        provider: 'MODELO_PREDITIVO',
        label: 'Motor Preditivo & Estimativa LOA',
        origin: 'DEMONSTRACAO',
        source: 'Modelo Estatístico baseado em LOA aprovada + histórico SICONFI',
        confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
        lastSync: new Date().toISOString(),
        lastSyncStatus: 'success',
        totalRecords: 0,
        anexo: 'Projeção preditiva municipal',
      },
    ];

    return sources;
  }

  /**
   * Gera um objeto DataSourceMetadata para uso nos payloads fiscais.
   */
  buildMetadata(params: {
    provider: string;
    isConnected: boolean;
    collectedAt?: string;
    anexo?: string;
  }) {
    if (params.isConnected) {
      return {
        origin: 'OFICIAL' as DataOrigin,
        source: this._getSourceLabel(params.provider),
        collectedAt: params.collectedAt ?? new Date().toLocaleDateString('pt-BR'),
        confidence: 'OFICIAL_HOMOLOGADO' as const,
        anexo: params.anexo,
      };
    }

    return {
      origin: 'DEMONSTRACAO' as DataOrigin,
      source: 'Motor Preditivo & Estimativa LOA',
      collectedAt: 'Base de Simulação Municipal',
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA' as const,
    };
  }

  private _mapStatus(status?: string): SyncStatus {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'ERROR': return 'error';
      case 'PARTIAL': return 'partial';
      default: return 'pending';
    }
  }

  private _getSourceLabel(provider: string): string {
    const labels: Record<string, string> = {
      SICONFI: 'SICONFI / Secretaria do Tesouro Nacional (STN)',
      TRANSFEREGOV: 'Transferegov / Ministério do Planejamento',
      TCE_PR: 'CAp Fiscal TCE-PR',
      PORTAL_TRANSPARENCIA: 'Portal Transparência / CGU',
      OBRASGOV: 'Obrasgov / MPTO',
    };
    return labels[provider] ?? provider;
  }
}
