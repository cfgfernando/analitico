import { Controller, Get, Post, Query, Param, Body, Req, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { SiconfiService } from './siconfi.service';
import { SiconfiSyncService } from './siconfi-sync.service';
import { resolveTenant } from '../municipalFiscalEngine';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/siconfi')
export class SiconfiController {
  constructor(
    @Inject(SiconfiService) private readonly siconfiService: SiconfiService,
    @Inject(SiconfiSyncService) private readonly siconfiSyncService: SiconfiSyncService
  ) {}

  /**
   * GET /api/siconfi/status
   * Consulta a latência e status de conectividade em tempo real com o SICONFI
   */
  @Public()
  @Get('status')
  async getStatus(@Query('tenantId') tenantId: string, @Query('codigoIbge') codigoIbge: string) {
    const tenantIdOrIbge = tenantId || codigoIbge || '4101804';
    const tenant = resolveTenant(tenantIdOrIbge, []);
    return this.siconfiService.checkStatus(tenant);
  }

  /**
   * POST /api/siconfi/sync
   * Dispara a rotina de sincronização contábil sob demanda
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Roles('MASTER_ADMIN', 'PREFEITO', 'SECRETARIO_FINANCAS')
  async triggerSync(
    @Query('tenantId') queryTenantId: string,
    @Body('tenantId') bodyTenantId: string,
    @Body('ano') ano: number
  ) {
    const tenantId = bodyTenantId || queryTenantId || 'tenant-araucaria';
    return this.siconfiSyncService.syncTenant(tenantId, ano || 2026);
  }

  /**
   * POST /api/siconfi/sync/:tenantId
   * Sincroniza dados contábeis de um município específico
   */
  @Post('sync/:tenantId')
  @HttpCode(HttpStatus.OK)
  @Roles('MASTER_ADMIN', 'PREFEITO', 'SECRETARIO_FINANCAS')
  async triggerSyncByParam(@Param('tenantId') tenantId: string, @Body('ano') ano: number) {
    return this.siconfiSyncService.syncTenant(tenantId, ano || 2026);
  }

  /**
   * GET /api/siconfi/logs
   * Retorna os registros de auditoria e histórico de sincronização
   */
  @Public()
  @Get('logs')
  getLogs(@Query('tenantId') tenantId?: string) {
    return {
      success: true,
      logs: this.siconfiSyncService.getLogs(tenantId),
    };
  }

  /**
   * GET /api/siconfi/proxy
   * Gateway proxy transparente para consultas dinâmicas à API Siconfi
   */
  @Public()
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
