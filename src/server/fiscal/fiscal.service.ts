import { Injectable } from '@nestjs/common';
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
} from '../municipalFiscalEngine';

@Injectable()
export class FiscalService {
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
}
