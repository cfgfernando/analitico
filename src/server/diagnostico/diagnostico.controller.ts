import { Controller, Post, Body, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { DiagnosticoService } from './diagnostico.service';
import { resolveTenant } from '../municipalFiscalEngine';

@Controller('api/fiscal/diagnostico-ia')
export class DiagnosticoController {
  constructor(@Inject(DiagnosticoService) private readonly diagnosticoService: DiagnosticoService) {}

  @Post()
  async gerarDiagnostico(@Body() body: any, @Req() req: Request) {
    const { summary, ano = 2026, prompt } = body || {};
    const tenantIdOrIbge =
      (req.query.tenantId as string) ||
      (req.query.codigoIbge as string) ||
      (req.headers['x-tenant-id'] as string) ||
      body?.tenantId ||
      '4101804';

    const tenant = resolveTenant(tenantIdOrIbge, []);
    return this.diagnosticoService.gerarDiagnostico(summary, tenant, ano, prompt);
  }
}
