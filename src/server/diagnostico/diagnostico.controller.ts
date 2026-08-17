import { Controller, Post, Body, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { DiagnosticoService } from './diagnostico.service';
import { resolveTenant } from '../municipalFiscalEngine';

@Controller('api/fiscal')
export class DiagnosticoController {
  constructor(@Inject(DiagnosticoService) private readonly diagnosticoService: DiagnosticoService) {}

  @Post('diagnostico-ia')
  async gerarDiagnostico(@Body() body: any, @Req() req: Request) {
    const prompt = body?.question || body?.prompt || '';
    const summary = body?.contextData || body?.summary || {};
    const ano = body?.ano ? Number(body.ano) : 2026;
    const tenantIdOrIbge =
      (req.query.tenantId as string) ||
      (req.query.codigoIbge as string) ||
      (req.headers['x-tenant-id'] as string) ||
      body?.tenantId ||
      '4101804';

    const tenant = resolveTenant(tenantIdOrIbge, []);
    return this.diagnosticoService.gerarDiagnostico(summary, tenant, ano, prompt);
  }

  @Post('analise-preditiva')
  async gerarAnalisePreditiva(@Body() body: any, @Req() req: Request) {
    const ano = body?.ano ? Number(body.ano) : 2026;
    const ultimos6Meses = body?.ultimos6Meses || [];
    const tenantIdOrIbge =
      (req.query.tenantId as string) ||
      (req.query.codigoIbge as string) ||
      (req.headers['x-tenant-id'] as string) ||
      body?.tenantId ||
      '4101804';

    const tenant = resolveTenant(tenantIdOrIbge, []);
    return this.diagnosticoService.gerarAnalisePreditiva(ano, ultimos6Meses, tenant);
  }
}

