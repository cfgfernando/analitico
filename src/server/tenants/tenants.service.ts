import { Injectable, NotFoundException, BadRequestException, Inject, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { MunicipiosService } from '../municipios/municipios.service';
import { TenantsRepository } from '../repositories/tenants.repository';
import { SiconfiSyncService } from '../siconfi/siconfi-sync.service';

export interface MockTenant {
  id: string;
  codigoIbge: string;
  nomePrefeitura: string;
  cidade: string;
  uf: string;
  cnpj: string;
  status: 'ATIVO' | 'SUSPENSO' | 'EM_IMPLANTACAO' | 'INADIMPLENTE';
  planoNome: string;
  valorMensalBase: number;
  userLimit: number;
  valorUsuarioExtra: number;
  diaVencimento: number;
  emailFaturamento: string;
  telefoneContato: string;
  createdAt: string;
}

export interface MockApiConfig {
  id: string;
  tenantId: string;
  providerName: 'SICONFI' | 'TRANSFEREGOV' | 'TCE_PR' | 'PORTAL_TRANSPARENCIA' | 'ERP_LOCAL' | 'OBRASGOV' | 'SIOPE';
  label: string;
  baseUrl: string;
  authType: 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC' | 'CERTIFICATE';
  apiKeyMasked?: string;
  customHeaders?: Record<string, string>;
  syncFrequency: string;
  ativo: boolean;
  ultimoStatus: 'SUCESSO' | 'ERRO' | 'PENDENTE' | 'EM_EXECUCAO';
  ultimaSincronizacao?: string;
  totalRegistrosSincronizados?: number;
}

@Injectable()
export class TenantsService implements OnModuleInit {
  private readonly logger = new Logger('TenantsService');
  private saasTenants: MockTenant[] = [
    {
      id: 'tenant-araucaria',
      codigoIbge: '4101804',
      nomePrefeitura: 'Prefeitura Municipal de Araucária',
      cidade: 'Araucária',
      uf: 'PR',
      cnpj: '76.105.535/0001-99',
      status: 'ATIVO',
      planoNome: 'Plano Gestão Fiscal Completo',
      valorMensalBase: 1890.0,
      userLimit: 2,
      valorUsuarioExtra: 150.0,
      diaVencimento: 10,
      emailFaturamento: 'fazenda@araucaria.pr.gov.br',
      telefoneContato: '(41) 3614-1400',
      createdAt: '2025-01-15T08:00:00.000Z',
    },
    {
      id: 'tenant-curitiba',
      codigoIbge: '4106902',
      nomePrefeitura: 'Prefeitura Municipal de Curitiba',
      cidade: 'Curitiba',
      uf: 'PR',
      cnpj: '76.417.005/0001-86',
      status: 'ATIVO',
      planoNome: 'Plano Capital & Metrópole',
      valorMensalBase: 3490.0,
      userLimit: 2,
      valorUsuarioExtra: 150.0,
      diaVencimento: 15,
      emailFaturamento: 'financas@curitiba.pr.gov.br',
      telefoneContato: '(41) 3350-8484',
      createdAt: '2025-02-01T09:30:00.000Z',
    },
    {
      id: 'tenant-londrina',
      codigoIbge: '4113700',
      nomePrefeitura: 'Prefeitura Municipal de Londrina',
      cidade: 'Londrina',
      uf: 'PR',
      cnpj: '75.771.477/0001-70',
      status: 'ATIVO',
      planoNome: 'Plano Básico Municipal',
      valorMensalBase: 1890.0,
      userLimit: 2,
      valorUsuarioExtra: 150.0,
      diaVencimento: 10,
      emailFaturamento: 'fazenda@londrina.pr.gov.br',
      telefoneContato: '(43) 3372-4000',
      createdAt: '2025-03-10T11:00:00.000Z',
    },
    {
      id: 'tenant-maringa',
      codigoIbge: '4115200',
      nomePrefeitura: 'Prefeitura Municipal de Maringá',
      cidade: 'Maringá',
      uf: 'PR',
      cnpj: '76.282.656/0001-06',
      status: 'ATIVO',
      planoNome: 'Plano Básico Municipal',
      valorMensalBase: 1890.0,
      userLimit: 2,
      valorUsuarioExtra: 150.0,
      diaVencimento: 20,
      emailFaturamento: 'contabilidade@maringa.pr.gov.br',
      telefoneContato: '(44) 3221-1234',
      createdAt: '2025-03-22T14:15:00.000Z',
    },
  ];

  private saasApiConfigs: MockApiConfig[] = [
    {
      id: 'api-ara-1',
      tenantId: 'tenant-araucaria',
      providerName: 'SICONFI',
      label: 'STN / Siconfi Datalake Araucária',
      baseUrl: 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt',
      authType: 'NONE',
      apiKeyMasked: 'siconfi-public-araucaria-4101804',
      syncFrequency: '0 6,18 * * *',
      ativo: true,
      ultimoStatus: 'SUCESSO',
      ultimaSincronizacao: 'Hoje às 06:00 (Automático)',
      totalRegistrosSincronizados: 14820,
    },
    {
      id: 'api-ara-2',
      tenantId: 'tenant-araucaria',
      providerName: 'TRANSFEREGOV',
      label: 'Transferegov / Obrasgov Federal',
      baseUrl: 'https://api.transferegov.sistema.gov.br/v1/convenios',
      authType: 'BEARER',
      apiKeyMasked: 'eyJhbGciOi...araucaria_key_transfere',
      syncFrequency: '0 6 * * *',
      ativo: true,
      ultimoStatus: 'SUCESSO',
      ultimaSincronizacao: 'Hoje às 06:15 (Automático)',
      totalRegistrosSincronizados: 342,
    },
    {
      id: 'api-ara-3',
      tenantId: 'tenant-araucaria',
      providerName: 'TCE_PR',
      label: 'Tribunal de Contas do Paraná (TCE-PR CAp)',
      baseUrl: 'https://servicos.tce.pr.gov.br/api/fiscal/v2',
      authType: 'API_KEY',
      apiKeyMasked: 'tcepr_live_sec_***89a1f',
      syncFrequency: '0 12 * * *',
      ativo: true,
      ultimoStatus: 'SUCESSO',
      ultimaSincronizacao: 'Ontem às 12:00',
      totalRegistrosSincronizados: 950,
    },
    {
      id: 'api-ara-4',
      tenantId: 'tenant-araucaria',
      providerName: 'ERP_LOCAL',
      label: 'Conector ERP Contábil IPM/Betha',
      baseUrl: 'https://transparencia.araucaria.pr.gov.br/ws/v1/contabil',
      authType: 'BASIC',
      apiKeyMasked: 'ipm_user_***pass***',
      syncFrequency: '*/30 * * * *',
      ativo: true,
      ultimoStatus: 'SUCESSO',
      ultimaSincronizacao: 'Hoje às 08:30',
      totalRegistrosSincronizados: 87400,
    },
  ];

  private siconfiSyncService: SiconfiSyncService | null = null;

  constructor(
    @Inject(MunicipiosService) private readonly municipiosService: MunicipiosService,
    @Inject(TenantsRepository) private readonly tenantsRepository: TenantsRepository,
    @Inject(forwardRef(() => SiconfiSyncService)) siconfiSyncService?: SiconfiSyncService
  ) {
    this.siconfiSyncService = siconfiSyncService || null;
  }

  async onModuleInit() {
    if (this.siconfiSyncService) {
      this.logger.log('SiconfiSyncService conectado ao TenantsService para sync real.');
    } else {
      this.logger.warn('SiconfiSyncService não disponível. Sync usará modo simulado.');
    }

    try {
      const dbTenants = await this.tenantsRepository.findAll();
      if (dbTenants && dbTenants.length > 0) {
        for (const dbT of dbTenants) {
          const exists = this.saasTenants.find(t => t.id === dbT.id || t.codigoIbge === dbT.codigoIbge);
          if (!exists) {
            this.saasTenants.push({
              id: dbT.id,
              codigoIbge: dbT.codigoIbge,
              nomePrefeitura: dbT.nomePrefeitura,
              cidade: dbT.cidade,
              uf: dbT.estadoUf,
              cnpj: dbT.cnpj,
              status: dbT.status as any,
              planoNome: 'Plano Básico Municipal',
              valorMensalBase: 1890.0,
              userLimit: 2,
              valorUsuarioExtra: 150.0,
              diaVencimento: 10,
              emailFaturamento: dbT.emailFaturamento || 'fazenda@prefeitura.gov.br',
              telefoneContato: dbT.telefoneContato || '(41) 3000-0000',
              createdAt: dbT.createdAt.toISOString(),
            });
          }
        }
        this.logger.log(`[TenantsService] ${this.saasTenants.length} prefeituras sincronizadas com o banco.`);
      }
    } catch (e: any) {
      this.logger.warn(`[TenantsService] Não foi possível sincronizar com o banco: ${e.message}`);
    }
  }

  getAllTenants() {
    return this.saasTenants.map(t => this.getTenantWithStats(t));
  }

  getTenantById(id: string) {
    const tenant = this.saasTenants.find(t => t.id === id || t.codigoIbge === id);
    if (!tenant) throw new NotFoundException('Prefeitura não encontrada.');
    return this.getTenantWithStats(tenant);
  }

  getRawTenants(): MockTenant[] {
    return this.saasTenants;
  }

  createTenant(dto: any) {
    const { codigoIbge, nomePrefeitura, cnpj } = dto;
    if (!codigoIbge || !nomePrefeitura || !cnpj) {
      throw new BadRequestException('Código IBGE, Nome da Prefeitura e CNPJ são obrigatórios.');
    }

    const existingIndex = this.saasTenants.findIndex(t => t.codigoIbge === codigoIbge);
    if (existingIndex !== -1) {
      const existing = this.saasTenants[existingIndex];
      Object.assign(existing, dto);
      existing.status = 'ATIVO';
      return {
        success: true,
        tenant: this.getTenantWithStats(existing),
        message: `Prefeitura ${existing.nomePrefeitura} atualizada com sucesso.`,
      };
    }

    const newId = `tenant-${Date.now()}`;
    const newTenant: MockTenant = {
      id: newId,
      codigoIbge,
      nomePrefeitura,
      cidade: dto.cidade || nomePrefeitura.replace('Prefeitura Municipal de ', ''),
      uf: dto.uf || 'PR',
      cnpj,
      status: 'ATIVO',
      planoNome: dto.planoNome || 'Plano Básico Municipal',
      valorMensalBase: Number(dto.valorMensalBase) || 1890.0,
      userLimit: Number(dto.userLimit) || 2,
      valorUsuarioExtra: Number(dto.valorUsuarioExtra) || 150.0,
      diaVencimento: 10,
      emailFaturamento: dto.emailFaturamento || 'fazenda@prefeitura.gov.br',
      telefoneContato: dto.telefoneContato || '(41) 3000-0000',
      createdAt: new Date().toISOString(),
    };

    this.saasTenants.push(newTenant);

    // Auto provision APIs
    const apis = this.municipiosService.generateDefaultApis(
      newTenant.cidade,
      newTenant.uf,
      newTenant.codigoIbge
    );

    apis.forEach((apiTemplate: any, idx: number) => {
      this.saasApiConfigs.push({
        id: `api-${Date.now()}-${idx}-${(apiTemplate.providerName || 'api').toLowerCase()}`,
        tenantId: newId,
        providerName: apiTemplate.providerName,
        label: apiTemplate.label || `${apiTemplate.providerName} (${newTenant.cidade})`,
        baseUrl: apiTemplate.baseUrl,
        authType: apiTemplate.authType || 'NONE',
        apiKeyMasked: apiTemplate.apiKeyMasked || `${(apiTemplate.providerName || 'api').toLowerCase()}-${codigoIbge}`,
        syncFrequency: apiTemplate.syncFrequency || '0 6,18 * * *',
        ativo: true,
        ultimoStatus: 'SUCESSO',
        ultimaSincronizacao: 'Cadastrado e conectado com sucesso',
        totalRegistrosSincronizados: 1250 * (idx + 1),
      });
    });

    return {
      success: true,
      tenant: this.getTenantWithStats(newTenant),
      message: `Prefeitura ${newTenant.nomePrefeitura} cadastrada com sucesso com ${apis.length} APIs provisionadas!`,
    };
  }

  updateTenant(id: string, dto: any) {
    const index = this.saasTenants.findIndex(t => t.id === id);
    if (index === -1) throw new NotFoundException('Prefeitura não encontrada.');

    this.saasTenants[index] = {
      ...this.saasTenants[index],
      ...dto,
      valorMensalBase: dto.valorMensalBase !== undefined ? Number(dto.valorMensalBase) : this.saasTenants[index].valorMensalBase,
      userLimit: dto.userLimit !== undefined ? Number(dto.userLimit) : this.saasTenants[index].userLimit,
      valorUsuarioExtra: dto.valorUsuarioExtra !== undefined ? Number(dto.valorUsuarioExtra) : this.saasTenants[index].valorUsuarioExtra,
      diaVencimento: dto.diaVencimento !== undefined ? Number(dto.diaVencimento) : this.saasTenants[index].diaVencimento,
    };

    return {
      success: true,
      tenant: this.getTenantWithStats(this.saasTenants[index]),
      message: `Dados da Prefeitura ${this.saasTenants[index].nomePrefeitura} atualizados com sucesso!`,
    };
  }

  deleteTenant(id: string) {
    const index = this.saasTenants.findIndex(t => t.id === id);
    if (index === -1) throw new NotFoundException('Prefeitura não encontrada.');

    const deleted = this.saasTenants[index];
    this.saasTenants = this.saasTenants.filter(t => t.id !== id);
    this.saasApiConfigs = this.saasApiConfigs.filter(a => a.tenantId !== id);

    return {
      success: true,
      message: `Prefeitura ${deleted.nomePrefeitura} e suas configurações foram removidas com sucesso.`,
    };
  }

  getTenantApis(tenantId: string) {
    return this.saasApiConfigs.filter(a => a.tenantId === tenantId);
  }

  createTenantApi(tenantId: string, dto: any) {
    const newApi: MockApiConfig = {
      id: `api-${Date.now()}`,
      tenantId,
      providerName: dto.providerName || 'SICONFI',
      label: dto.label || 'Nova API',
      baseUrl: dto.baseUrl || 'https://api.gov.br',
      authType: dto.authType || 'NONE',
      apiKeyMasked: dto.apiKey ? `***${dto.apiKey.slice(-4)}` : undefined,
      customHeaders: dto.customHeaders,
      syncFrequency: dto.syncFrequency || '0 6,18 * * *',
      ativo: true,
      ultimoStatus: 'SUCESSO',
      ultimaSincronizacao: 'Cadastrado e conectado com sucesso',
      totalRegistrosSincronizados: 0,
    };
    this.saasApiConfigs.push(newApi);
    return { success: true, api: newApi, message: 'API conectada com sucesso!' };
  }

  deleteTenantApi(tenantId: string, apiId: string) {
    this.saasApiConfigs = this.saasApiConfigs.filter(a => !(a.tenantId === tenantId && a.id === apiId));
    return { success: true, message: 'API removida com sucesso.' };
  }

  async syncTenantApi(tenantId: string, apiId: string) {
    const api = this.saasApiConfigs.find(a => a.id === apiId && a.tenantId === tenantId);
    if (!api) throw new NotFoundException('API não encontrada para esta prefeitura.');
    if (!api.ativo) throw new BadRequestException('Esta API está desativada. Ative-a antes de sincronizar.');

    const tenant = this.saasTenants.find(t => t.id === tenantId);
    if (!tenant) throw new NotFoundException('Prefeitura não encontrada.');

    api.ultimoStatus = 'EM_EXECUCAO';
    api.ultimaSincronizacao = `Sync iniciado às ${new Date().toLocaleTimeString('pt-BR')}`;

    try {
      let syncResult: any = null;
      const ano = new Date().getFullYear();

      if (api.providerName === 'SICONFI' && this.siconfiSyncService) {
        syncResult = await this.siconfiSyncService.syncTenant(tenantId, ano);
      } else {
        syncResult = {
          status: 'SUCESSO',
          totalRegistros: Math.floor(Math.random() * 450 + 50),
          detalhes: `Sync simulado para provider ${api.providerName}`,
        };
      }

      api.ultimoStatus = syncResult?.status === 'ERRO' ? 'ERRO' : 'SUCESSO';
      api.ultimaSincronizacao = `Sincronizado manualmente às ${new Date().toLocaleTimeString('pt-BR')}`;
      api.totalRegistrosSincronizados = (api.totalRegistrosSincronizados || 0) + (syncResult?.totalRegistros || 0);

      this.logger.log(`[SYNC] API ${api.label} sincronizada: ${syncResult?.totalRegistros || 0} registros`);

      return {
        success: true,
        api,
        message: `Sincronização da API ${api.label} concluída com êxito. ${(syncResult?.totalRegistros || 0)} registros processados.`,
        syncResult,
      };
    } catch (error: any) {
      api.ultimoStatus = 'ERRO';
      this.logger.error(`[SYNC] Erro ao sincronizar API ${api.label}: ${error.message}`);
      throw new BadRequestException(`Falha na sincronização: ${error.message}`);
    }
  }

  updateTenantBranding(tenantId: string, brandingData: any) {
    const tenant = this.saasTenants.find(t => t.id === tenantId);
    if (!tenant) throw new NotFoundException('Prefeitura não encontrada.');

    const branding = {
      logoUrl: brandingData.logoUrl || null,
      corPrimaria: brandingData.corPrimaria || '#1e40af',
      corSecundaria: brandingData.corSecundaria || '#0ea5e9',
      nomePersonalizado: brandingData.nomePersonalizado || tenant.nomePrefeitura,
      faviconUrl: brandingData.faviconUrl || null,
      textoRodape: brandingData.textoRodape || '',
      whiteLabel: brandingData.whiteLabel || false,
    };

    return {
      success: true,
      branding,
      tenant: this.getTenantWithStats(tenant),
      message: 'Personalização atualizada com sucesso!',
    };
  }

  solicitacaoUsuario(data: any) {
    const { tenantId, nomeSolicitante, emailSolicitante, nomeNovoUsuario, emailNovoUsuario, cargoNovoUsuario } = data;
    if (!tenantId || !nomeNovoUsuario || !emailNovoUsuario) {
      throw new BadRequestException('Dados obrigatórios não informados.');
    }

    const protocolo = `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    this.logger.log(`[SOLICITACAO] Nova solicitação de usuário: ${protocolo} (${emailNovoUsuario} -> ${tenantId})`);

    return {
      success: true,
      protocolo,
      message: `Solicitação ${protocolo} registrada com sucesso. O usuário ${nomeNovoUsuario} receberá um convite em ${emailNovoUsuario}.`,
    };
  }

  private getTenantWithStats(tenant: MockTenant) {
    const tenantApis = this.saasApiConfigs.filter(a => a.tenantId === tenant.id);
    const apisAtivas = tenantApis.filter(a => a.ativo).length;
    const usuariosExcedentes = 0;
    const valorTotalMensalidade = Number(tenant.valorMensalBase || 1890) + (usuariosExcedentes * Number(tenant.valorUsuarioExtra || 150));
    return {
      ...tenant,
      totalUsuariosAtivos: 2,
      usuariosAtivos: 2,
      usuariosInclusos: 2,
      usuariosExcedentes,
      valorTotalMensalidade,
      faturamentoEstimadoTotal: valorTotalMensalidade,
      apisConfiguradas: tenantApis.length,
      totalApisConfiguradas: tenantApis.length,
      apisAtivas,
    };
  }
}
