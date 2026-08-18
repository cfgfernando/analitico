import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  TenantInfo,
  resolveTenant,
  getMunicipalFiscalSummary,
  getMunicipalReceitas,
  getMunicipalDespesas,
  getMunicipalLimites,
  getMunicipalCaptacao,
  getMunicipalFundeb,
  getMunicipalAlertas,
  getMunicipalObras,
  getPainelPrefeito,
  getMunicipalRadarCaptacao,
  simularContrapartida,
  getMunicipalSimuladorCenarios,
  ParametrosSimulacaoLoa,
  getMunicipalSimuladorReforma,
  getMunicipalBenchmark,
  getMunicipalSeloConformidade,
  getMunicipalAlertasProativos,
  getParametrosAlertas,
  salvarParametrosAlertas,
  getDecisoesGabinete,
  despacharDecisaoGabinete,
} from '../municipalFiscalEngine';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getSummary(tenant: TenantInfo, ano: number = 2026) {
    return getMunicipalFiscalSummary(tenant, ano);
  }

  getReceitas(tenant: TenantInfo, ano: number = 2026) {
    return getMunicipalReceitas(tenant, ano);
  }

  getDespesas(tenant: TenantInfo, ano: number = 2026) {
    return getMunicipalDespesas(tenant, ano);
  }

  getLimites(tenant: TenantInfo, ano: number = 2026) {
    return getMunicipalLimites(tenant, ano);
  }

  getCaptacao(tenant: TenantInfo) {
    return getMunicipalCaptacao(tenant);
  }

  getFundeb(tenant: TenantInfo) {
    return getMunicipalFundeb(tenant);
  }

  getAlertas(tenant: TenantInfo) {
    return getMunicipalAlertas(tenant);
  }

  getObras(tenant: TenantInfo) {
    return getMunicipalObras(tenant);
  }

  getPainelPrefeito(tenant: TenantInfo, ano: number = 2026) {
    return getPainelPrefeito(tenant, ano);
  }

  getRadarCaptacao(tenant: TenantInfo) {
    return getMunicipalRadarCaptacao(tenant);
  }

  simularContrapartida(tenant: TenantInfo, valorGlobal: number, percentualContrapartida?: number) {
    return simularContrapartida(tenant, valorGlobal, percentualContrapartida);
  }

  getSimuladorCenarios(tenant: TenantInfo, params?: ParametrosSimulacaoLoa) {
    return getMunicipalSimuladorCenarios(tenant, params);
  }

  getSimuladorReforma(tenant: TenantInfo, variacaoArrecadacaoPropriaPct: number = 0) {
    return getMunicipalSimuladorReforma(tenant, variacaoArrecadacaoPropriaPct);
  }

  getBenchmark(tenant: TenantInfo) {
    return getMunicipalBenchmark(tenant);
  }

  getSeloConformidade(tenant: TenantInfo, ano: number = 2026) {
    return getMunicipalSeloConformidade(tenant, ano);
  }

  getAlertasProativos(tenant: TenantInfo) {
    return getMunicipalAlertasProativos(tenant);
  }

  getParametrosAlertas(tenant: TenantInfo) {
    return getParametrosAlertas(tenant);
  }

  salvarParametrosAlertas(tenant: TenantInfo, novasRegras: any[]) {
    return salvarParametrosAlertas(tenant, novasRegras);
  }

  getDecisoesGabinete(tenant: TenantInfo) {
    return getDecisoesGabinete(tenant);
  }

  despacharDecisaoGabinete(tenant: TenantInfo, decisaoId: string, acao: any, dadosDespacho?: any) {
    return despacharDecisaoGabinete(tenant, decisaoId, acao, dadosDespacho);
  }
}
