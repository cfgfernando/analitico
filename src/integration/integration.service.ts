import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SiopsAdapter } from './adapters/siops.adapter';
import { SiopeAdapter } from './adapters/siope.adapter';
import { CaucAdapter } from './adapters/cauc.adapter';
import { PncpAdapter } from './adapters/pncp.adapter';
import { TransparenciaFederalAdapter } from './adapters/transparencia-federal.adapter';
import { IbgeAdapter } from './adapters/ibge.adapter';
import { IpardesAdapter } from './adapters/ipardes.adapter';
import { BacenSgsAdapter } from './adapters/bacen-sgs.adapter';
import { NovoPacAdapter } from './adapters/novo-pac.adapter';
import { FinancialRepository } from '../server/repositories/financial.repository';
import { TenantsRepository } from '../server/repositories/tenants.repository';
import { DataProvenanceService } from '../server/fiscal/data-provenance.service';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  readonly siopsAdapter = new SiopsAdapter();
  readonly siopeAdapter = new SiopeAdapter();
  readonly caucAdapter = new CaucAdapter();
  readonly pncpAdapter = new PncpAdapter();
  readonly transparenciaAdapter = new TransparenciaFederalAdapter();
  readonly ibgeAdapter = new IbgeAdapter();
  readonly ipardesAdapter = new IpardesAdapter();
  readonly bacenAdapter = new BacenSgsAdapter();
  readonly pacAdapter = new NovoPacAdapter();

  constructor(
    @Inject(FinancialRepository) private readonly financialRepo: FinancialRepository,
    @Inject(TenantsRepository) private readonly tenantsRepo: TenantsRepository,
    @Optional() @Inject(DataProvenanceService) private readonly provenanceService?: DataProvenanceService,
  ) {}

  // =========================================================================
  // CRON JOBS PERIÓDICOS
  // =========================================================================

  @Cron('0 8 * * 1')
  async cronWeeklySync() {
    this.logger.log('[CRON INTEGRATION] Iniciando rotina semanal de saúde, educação e contratos...');
    const tenants = await this.tenantsRepo.findAll();
    for (const tenant of tenants) {
      if (tenant.status === 'ATIVO') {
        try {
          await Promise.allSettled([
            this.syncSiops(tenant.id, tenant.codigoIbge, tenant.uf, 2026),
            this.syncSiope(tenant.id, tenant.codigoIbge, tenant.uf, 2026),
            this.syncPncp(tenant.id, tenant.codigoIbge, tenant.uf, 2026),
          ]);
        } catch (err: any) {
          this.logger.error(`[CRON] Erro no tenant ${tenant.cidade}: ${err.message}`);
        }
      }
    }
  }

  @Cron('0 9 * * *')
  async cronDailySync() {
    this.logger.log('[CRON INTEGRATION] Iniciando rotina diária de CAUC, Transparência e Macroeconomia...');
    const tenants = await this.tenantsRepo.findAll();
    for (const tenant of tenants) {
      if (tenant.status === 'ATIVO') {
        try {
          await Promise.allSettled([
            this.syncCauc(tenant.id, tenant.codigoIbge, tenant.uf),
            this.syncTransparencia(tenant.id, tenant.codigoIbge, tenant.uf),
            this.syncBacen(tenant.id, tenant.codigoIbge, tenant.uf),
            this.syncPac(tenant.id, tenant.codigoIbge, tenant.uf),
          ]);
        } catch (err: any) {
          this.logger.error(`[CRON] Erro no tenant ${tenant.cidade}: ${err.message}`);
        }
      }
    }
  }

  // =========================================================================
  // MÉTODOS DE SINCRONIZAÇÃO ESPECÍFICOS
  // =========================================================================

  async syncSiops(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.siopsAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    if (this.provenanceService) {
      await this.provenanceService.recordSync({
        tenantId,
        provider: 'SIOPS_SAUDE',
        status: result.success ? 'success' : 'error',
        recordsIngested: result.recordsCount,
      });
    }
    return result;
  }

  async syncSiope(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.siopeAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    if (this.provenanceService) {
      await this.provenanceService.recordSync({
        tenantId,
        provider: 'SIOPE_EDUCACAO',
        status: result.success ? 'success' : 'error',
        recordsIngested: result.recordsCount,
      });
    }
    return result;
  }

  async syncCauc(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.caucAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    if (this.provenanceService) {
      await this.provenanceService.recordSync({
        tenantId,
        provider: 'CAUC',
        status: result.success ? 'success' : 'error',
        recordsIngested: result.recordsCount,
      });
    }
    return result;
  }

  async syncPncp(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.pncpAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    if (this.provenanceService) {
      await this.provenanceService.recordSync({
        tenantId,
        provider: 'PNCP_CONTRATOS',
        status: result.success ? 'success' : 'error',
        recordsIngested: result.recordsCount,
      });
    }
    return result;
  }

  async syncTransparencia(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.transparenciaAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    return result;
  }

  async syncIbge(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.ibgeAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    return result;
  }

  async syncIpardes(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.ipardesAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    return result;
  }

  async syncBacen(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.bacenAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    return result;
  }

  async syncPac(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const result = await this.pacAdapter.syncTenant(tenantId, codigoIbge, uf, ano);
    if (result.data?.financialRecords?.length) {
      await this.financialRepo.saveBatch(result.data.financialRecords);
    }
    return result;
  }

  /**
   * Sincroniza simultaneamente todas as fontes governamentais integradas de forma paralela e resiliente.
   */
  async syncAllSources(tenantId: string, codigoIbge: string, uf: string, ano = 2026) {
    const [siops, siope, cauc, pncp, transparencia, ibge, ipardes, bacen, pac] = await Promise.allSettled([
      this.syncSiops(tenantId, codigoIbge, uf, ano),
      this.syncSiope(tenantId, codigoIbge, uf, ano),
      this.syncCauc(tenantId, codigoIbge, uf, ano),
      this.syncPncp(tenantId, codigoIbge, uf, ano),
      this.syncTransparencia(tenantId, codigoIbge, uf, ano),
      this.syncIbge(tenantId, codigoIbge, uf, ano),
      this.syncIpardes(tenantId, codigoIbge, uf, ano),
      this.syncBacen(tenantId, codigoIbge, uf, ano),
      this.syncPac(tenantId, codigoIbge, uf, ano),
    ]);

    return {
      tenantId,
      codigoIbge,
      ano,
      siops: siops.status === 'fulfilled' ? siops.value : { success: false },
      siope: siope.status === 'fulfilled' ? siope.value : { success: false },
      cauc: cauc.status === 'fulfilled' ? cauc.value : { success: false },
      pncp: pncp.status === 'fulfilled' ? pncp.value : { success: false },
      transparencia: transparencia.status === 'fulfilled' ? transparencia.value : { success: false },
      ibge: ibge.status === 'fulfilled' ? ibge.value : { success: false },
      ipardes: ipardes.status === 'fulfilled' ? ipardes.value : { success: false },
      bacen: bacen.status === 'fulfilled' ? bacen.value : { success: false },
      novoPac: pac.status === 'fulfilled' ? pac.value : { success: false },
      timestamp: new Date().toISOString(),
    };
  }
}
