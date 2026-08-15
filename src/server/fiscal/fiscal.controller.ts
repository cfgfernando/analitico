import { Controller, Get, Post, Body, Query, Req, Inject, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { FiscalService } from './fiscal.service';
import { resolveTenant } from '../municipalFiscalEngine';
import { TenantGuard } from '../auth/guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller('api/fiscal')
export class FiscalController {
  constructor(@Inject(FiscalService) private readonly fiscalService: FiscalService) {}

  private extractTenant(req: any): any {
    const tenantIdOrIbge =
      req.tenantId ||
      req.user?.tenantId ||
      (req.query?.tenantId as string) ||
      (req.query?.codigoIbge as string) ||
      (req.headers ? req.headers['x-tenant-id'] : undefined) ||
      '4101804';
    return resolveTenant(tenantIdOrIbge, []);
  }

  @Get('summary')
  getSummary(@Req() req: Request, @Query('ano') anoStr?: string) {
    const ano = parseInt(anoStr || '2026', 10);
    const tenant = this.extractTenant(req);
    return this.fiscalService.getSummary(tenant, isNaN(ano) ? 2026 : ano);
  }

  @Get('receitas')
  getReceitas(@Req() req: Request, @Query('ano') anoStr?: string) {
    const ano = parseInt(anoStr || '2026', 10);
    const tenant = this.extractTenant(req);
    return this.fiscalService.getReceitas(tenant, isNaN(ano) ? 2026 : ano);
  }

  @Get('despesas')
  getDespesas(@Req() req: Request, @Query('ano') anoStr?: string) {
    const ano = parseInt(anoStr || '2026', 10);
    const tenant = this.extractTenant(req);
    return this.fiscalService.getDespesas(tenant, isNaN(ano) ? 2026 : ano);
  }

  @Get('lrf')
  getLimites(@Req() req: Request, @Query('ano') anoStr?: string) {
    const ano = parseInt(anoStr || '2026', 10);
    const tenant = this.extractTenant(req);
    return this.fiscalService.getLimites(tenant, isNaN(ano) ? 2026 : ano);
  }

  @Get('captacao')
  getCaptacao(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getCaptacao(tenant);
  }

  @Get('fundeb')
  getFundeb(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getFundeb(tenant);
  }

  @Get('alertas')
  getAlertas(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getAlertas(tenant);
  }

  @Get('obras')
  getObras(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getObras(tenant);
  }

  @Get('painel-prefeito')
  getPainelPrefeito(@Req() req: Request, @Query('ano') ano?: string) {
    const tenant = this.extractTenant(req);
    const parsedAno = ano ? parseInt(ano, 10) : 2026;
    return this.fiscalService.getPainelPrefeito(tenant, parsedAno);
  }

  @Get('radar-captacao')
  getRadarCaptacao(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getRadarCaptacao(tenant);
  }

  @Post('radar-captacao/simular')
  simularContrapartida(@Req() req: Request, @Body() body: { valorGlobal: number; percentualContrapartida?: number }) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.simularContrapartida(tenant, body.valorGlobal, body.percentualContrapartida);
  }

  @Get('simulador-reforma')
  getSimuladorReforma(@Req() req: Request, @Query('ajusteProprio') ajusteProprio?: string) {
    const tenant = this.extractTenant(req);
    const parsedAjuste = ajusteProprio ? parseFloat(ajusteProprio) : 0;
    return this.fiscalService.getSimuladorReforma(tenant, parsedAjuste);
  }

  @Post('simulador-reforma/ajustar')
  ajustarSimulacaoReforma(@Req() req: Request, @Body() body: { variacaoArrecadacaoPropriaPct: number }) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getSimuladorReforma(tenant, body.variacaoArrecadacaoPropriaPct || 0);
  }

  @Get('benchmark')
  getBenchmark(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getBenchmark(tenant);
  }

  @Get('selo-conformidade')
  getSeloConformidade(@Req() req: Request, @Query('ano') ano?: string) {
    const tenant = this.extractTenant(req);
    const parsedAno = ano ? parseInt(ano, 10) : 2026;
    return this.fiscalService.getSeloConformidade(tenant, parsedAno);
  }
}
