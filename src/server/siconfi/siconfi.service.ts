import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantsRepository } from '../repositories/tenants.repository';
import { TenantInfo, getMunicipalSiconfiStatus, resolveTenant } from '../municipalFiscalEngine';
import { FinancialCategory, SyncStatus } from '@prisma/client';

@Injectable()
export class SiconfiService {
  private readonly logger = new Logger(SiconfiService.name);
  private cacheStore: Record<string, { data: any; timestamp: number }> = {};
  // Tempo parametrizável de sincronização (padrão: 24 horas)
  private readonly CACHE_TTL_MS = (parseInt(process.env.SICONFI_SYNC_TTL_HOURS || '24', 10)) * 60 * 60 * 1000;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantsRepository) private readonly tenantsRepository: TenantsRepository,
  ) {}

  async fetchSiconfi(endpoint: string, params: Record<string, string>) {
    const queryParams = new URLSearchParams(params).toString();
    const fullUrl = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/${endpoint}?${queryParams}`;
    const cacheKey = fullUrl;

    const idEnte = params.id_ente || params.codigoIbge || '4101804';
    const ano = parseInt(params.an_exercicio || '2024', 10);
    const tenant = resolveTenant(idEnte, []);

    // 1. Estratégia DB-First: Consulta se já temos dados persistidos no MySQL da prefeitura
    if (this.prisma.isDbConnected()) {
      try {
        const sourceKeyPrefix = endpoint.toLowerCase().includes('rgf') ? 'SICONFI_RGF' : 'SICONFI_RREO';
        const dbRecords = await this.prisma.financialRecord.findMany({
          where: {
            OR: [
              { tenantId: tenant.id },
              { tenantId: tenant.codigoIbge },
            ],
            sourceKey: { startsWith: sourceKeyPrefix },
          },
          orderBy: { syncedAt: 'desc' },
          take: 80,
        });

        // Se encontramos registros no banco e a última sincronização está dentro do tempo parametrizado
        if (dbRecords.length > 0) {
          const latestSync = dbRecords[0].syncedAt.getTime();
          const isFresh = (Date.now() - latestSync) < this.CACHE_TTL_MS;

          // Se fresco ou em memória, retorna imediatamente do banco local
          if (isFresh || params.force !== 'true') {
            const items = dbRecords.map((r) => {
              try {
                if (r.dadosOrigemJson) return JSON.parse(r.dadosOrigemJson);
              } catch {}
              return {
                cod_conta: r.accountCode,
                conta: r.accountName,
                valor: r.valor,
                coluna: 'Total',
                an_exercicio: r.exercicioAno,
              };
            });

            return {
              data: { items, count: items.length },
              fromDb: true,
              totalDbRecords: dbRecords.length,
              lastSyncedAt: dbRecords[0].syncedAt.toISOString(),
              sourceUrl: fullUrl,
            };
          }
        }
      } catch (dbErr: any) {
        this.logger.warn(`[Siconfi DB Check] Erro na consulta ao MySQL: ${dbErr.message}`);
      }
    }

    // 2. Cache em Memória
    const cached = this.cacheStore[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS && params.force !== 'true') {
      return { data: cached.data, fromCache: true, sourceUrl: fullUrl };
    }

    // 3. Consulta à API Oficial do Tesouro Nacional / Siconfi Data Lake
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
        throw new Error(`Siconfi API retornou status HTTP ${response.status}`);
      }

      const jsonData = await response.json();
      this.cacheStore[cacheKey] = { data: jsonData, timestamp: Date.now() };

      // 4. Salva incrementalmente os novos registros no banco MySQL da prefeitura
      if (this.prisma.isDbConnected() && Array.isArray(jsonData?.items) && jsonData.items.length > 0) {
        try {
          const recordsToInsert = jsonData.items.slice(0, 50).map((item: any) => {
            const isDespesa = (item.conta || '').toLowerCase().includes('despesa');
            return {
              tenantId: tenant.id,
              sourceKey: endpoint.toLowerCase().includes('rgf') ? 'SICONFI_RGF_01' : 'SICONFI_RREO_01',
              exercicioAno: parseInt(item.an_exercicio || String(ano), 10),
              periodo: String(item.nr_periodo || '1'),
              categoria: endpoint.toLowerCase().includes('rgf')
                ? FinancialCategory.RGF
                : isDespesa ? FinancialCategory.DESPESA : FinancialCategory.RECEITA,
              accountCode: item.cod_conta || (isDespesa ? 'DESP_OFICIAL' : 'REC_OFICIAL'),
              accountName: item.conta || 'Conta Orçamentária Oficial',
              valor: Number(item.valor || 0),
              dadosOrigemJson: JSON.stringify(item),
              isDemonstracao: false,
              syncedAt: new Date(),
            };
          });

          await this.prisma.financialRecord.createMany({
            data: recordsToInsert,
            skipDuplicates: true,
          });

          await this.prisma.syncLog.create({
            data: {
              tenantId: tenant.id,
              sourceKey: `SICONFI_${endpoint.toUpperCase()}`,
              status: SyncStatus.SUCESSO,
              recordsImported: recordsToInsert.length,
              startedAt: new Date(),
              finishedAt: new Date(),
            },
          });
        } catch (saveErr: any) {
          this.logger.warn(`[Siconfi DB Save] Erro ao persistir registros: ${saveErr.message}`);
        }
      }

      return { data: jsonData, fromCache: false, sourceUrl: fullUrl };
    } catch (error: any) {
      this.logger.warn(`[Siconfi Fetch Warning] ${endpoint}: ${error.message}`);
      
      // Se houver cache em memória, usa como fallback
      if (cached) {
        return { data: cached.data, fromCache: true, sourceUrl: fullUrl, isStale: true };
      }

      // Se houver dados no banco, retorna do banco com aviso
      if (this.prisma.isDbConnected()) {
        try {
          const dbRecords = await this.prisma.financialRecord.findMany({
            where: {
              OR: [{ tenantId: tenant.id }, { tenantId: tenant.codigoIbge }],
            },
            take: 40,
          });
          if (dbRecords.length > 0) {
            const items = dbRecords.map(r => ({
              cod_conta: r.accountCode,
              conta: r.accountName,
              valor: r.valor,
              an_exercicio: r.exercicioAno,
            }));
            return {
              data: { items, count: items.length },
              fromDb: true,
              sourceUrl: fullUrl,
              warning: 'API externa temporariamente indisponível. Exibindo dados persistidos no banco.',
            };
          }
        } catch {}
      }

      return {
        data: { items: [], count: 0 },
        error: error.message,
        sourceUrl: fullUrl,
        message: 'Aguardando sincronização com a API do Siconfi.',
      };
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
