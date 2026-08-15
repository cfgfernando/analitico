import { Controller, Get, Query, Req, Inject } from '@nestjs/common';
import { SiconfiService } from './siconfi.service';
import { resolveTenant } from '../municipalFiscalEngine';

@Controller('api/siconfi')
export class SiconfiController {
  constructor(@Inject(SiconfiService) private readonly siconfiService: SiconfiService) {}

  @Get('status')
  async getStatus(@Query('tenantId') tenantId: string, @Query('codigoIbge') codigoIbge: string) {
    const tenantIdOrIbge = tenantId || codigoIbge || '4101804';
    const tenant = resolveTenant(tenantIdOrIbge, []);
    return this.siconfiService.checkStatus(tenant);
  }

  @Get('proxy')
  async queryProxy(@Query() query: Record<string, string>) {
    const endpoint = query.endpoint || 'entes';
    const tenantIdOrIbge = query.tenantId || query.codigoIbge || query.id_ente || '4101804';
    const tenant = resolveTenant(tenantIdOrIbge, []);

    const queryParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(query)) {
      if (k !== 'endpoint' && typeof v === 'string') {
        queryParams[k] = v;
      }
    }

    if (!queryParams['id_ente']) {
      queryParams['id_ente'] = tenant.codigoIbge;
    }

    return this.siconfiService.fetchSiconfi(endpoint, queryParams);
  }
}
