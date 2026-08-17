import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { MunicipiosService } from '../municipios/municipios.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/saas')
export class TenantsController {
  constructor(
    @Inject(TenantsService) private readonly tenantsService: TenantsService,
    @Inject(MunicipiosService) private readonly municipiosService: MunicipiosService
  ) {}

  @Public()
  @Get('municipios/lookup')
  lookupMunicipio(
    @Query('termo') termo: string,
    @Query('query') query: string,
    @Query('codigoIbge') codigoIbge: string
  ) {
    const q = query || termo || codigoIbge || '';
    const discovered = this.municipiosService.discoverMunicipality(q);
    return {
      success: !!discovered,
      municipality: discovered,
      municipio: discovered,
      message: discovered ? `Município de ${discovered.cidade} (${discovered.uf}) localizado!` : 'Município não encontrado.',
    };
  }

  @Get('municipios/suggestions')
  getSuggestions(@Query('q') q?: string) {
    const query = q || '';
    const results = this.municipiosService.search(query).slice(0, 8);
    return { success: true, suggestions: results };
  }

  @Get('tenants')
  listTenants() {
    return { success: true, tenants: this.tenantsService.getAllTenants() };
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return { success: true, tenant: this.tenantsService.getTenantById(id) };
  }

  @Post('tenants')
  createTenant(@Body() body: any) {
    return this.tenantsService.createTenant(body);
  }

  @Put('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.updateTenant(id, body);
  }

  @Put('tenants/:id/branding')
  updateBranding(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.updateTenantBranding(id, body);
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }

  @Get('tenants/:id/apis')
  getTenantApis(@Param('id') id: string) {
    return { success: true, apis: this.tenantsService.getTenantApis(id) };
  }

  @Post('tenants/:id/apis')
  createTenantApi(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.createTenantApi(id, body);
  }

  @Post('tenants/:id/apis/:apiId/sync')
  syncTenantApi(@Param('id') id: string, @Param('apiId') apiId: string) {
    return this.tenantsService.syncTenantApi(id, apiId);
  }

  @Delete('tenants/:id/apis/:apiId')
  deleteTenantApi(@Param('id') id: string, @Param('apiId') apiId: string) {
    return this.tenantsService.deleteTenantApi(id, apiId);
  }

  @Public()
  @Post('solicitacao-usuario')
  solicitacaoUsuario(@Body() body: any) {
    return this.tenantsService.solicitacaoUsuario(body);
  }
}
