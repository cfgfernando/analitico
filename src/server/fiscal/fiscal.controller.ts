import { Controller, Get, Post, Body, Query, Req, Inject, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { FiscalService } from './fiscal.service';
import { DataProvenanceService } from './data-provenance.service';
import { resolveTenant } from '../municipalFiscalEngine';
import { TenantGuard } from '../auth/guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller('api/fiscal')
export class FiscalController {
  constructor(
    @Inject(FiscalService) private readonly fiscalService: FiscalService,
    @Inject(DataProvenanceService) private readonly provenanceService: DataProvenanceService,
  ) {}

  private extractTenant(req: any): any {
    const explicitTenant =
      (req.query?.tenantId as string) ||
      (req.query?.codigoIbge as string) ||
      (req.headers ? (req.headers['x-tenant-id'] as string) : undefined);

    const tenantIdOrIbge = explicitTenant || req.tenantId || req.user?.tenantId || '4101804';
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

  @Get('simulador-cenarios')
  getSimuladorCenarios(
    @Req() req: Request,
    @Query('variacaoIssPct') variacaoIssPct?: string,
    @Query('recadastramentoPgvPct') recadastramentoPgvPct?: string,
    @Query('corteCusteioPct') corteCusteioPct?: string,
    @Query('variacaoItbiPct') variacaoItbiPct?: string,
  ) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getSimuladorCenarios(tenant, {
      variacaoIssPct: variacaoIssPct ? parseFloat(variacaoIssPct) : 0,
      recadastramentoPgvPct: recadastramentoPgvPct ? parseFloat(recadastramentoPgvPct) : 0,
      corteCusteioPct: corteCusteioPct ? parseFloat(corteCusteioPct) : 0,
      variacaoItbiPct: variacaoItbiPct ? parseFloat(variacaoItbiPct) : 0,
    });
  }

  @Post('simulador-cenarios/simular')
  simularCenariosLoa(
    @Req() req: Request,
    @Body() body: {
      variacaoIssPct?: number;
      recadastramentoPgvPct?: number;
      corteCusteioPct?: number;
      variacaoItbiPct?: number;
    }
  ) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getSimuladorCenarios(tenant, body);
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

  @Get('alertas-proativos')
  getAlertasProativos(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getAlertasProativos(tenant);
  }

  @Get('alertas-proativos/parametros')
  getParametrosAlertas(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getParametrosAlertas(tenant);
  }

  @Post('alertas-proativos/parametros')
  salvarParametrosAlertas(@Req() req: Request, @Body() body: { regras: any[] }) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.salvarParametrosAlertas(tenant, body.regras || []);
  }

  @Get('decisoes-gabinete')
  getDecisoesGabinete(@Req() req: Request) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.getDecisoesGabinete(tenant);
  }

  @Post('decisoes-gabinete/despachar')
  despacharDecisaoGabinete(
    @Req() req: Request,
    @Body() body: { decisaoId: string; acao: 'MARCAR_TOMADA' | 'REPROGRAMAR_PROXIMA_SEMANA'; dadosDespacho?: any }
  ) {
    const tenant = this.extractTenant(req);
    return this.fiscalService.despacharDecisaoGabinete(tenant, body.decisaoId, body.acao, body.dadosDespacho);
  }

  /**
   * GET /api/fiscal/proveniencia
   * Retorna o status de rastreabilidade de todas as fontes de dados do tenant.
   * Usado pelo DataProvenancePanel no frontend.
   */
  @Get('proveniencia')
  async getProveniencia(@Req() req: Request) {
    const tenantId = (req as any).tenantId
      || (req as any).user?.tenantId
      || (req.query?.tenantId as string)
      || 'tenant-demo';
    const sources = await this.provenanceService.getSourcesStatus(tenantId);
    return { success: true, tenantId, sources };
  }

  /**
   * GET /api/fiscal/proveniencia/historico
   * Retorna o histórico de sincronizações do tenant (últimas 50 entradas).
   */
  @Get('proveniencia/historico')
  async getProvenienciaHistorico(@Req() req: Request, @Query('limit') limitStr?: string) {
    const tenantId = (req as any).tenantId
      || (req as any).user?.tenantId
      || (req.query?.tenantId as string)
      || 'tenant-demo';
    const limit = limitStr ? Math.min(parseInt(limitStr, 10), 100) : 50;
    const logs = await this.provenanceService.getSyncHistory(tenantId, limit);
    return { success: true, tenantId, logs };
  }
}
