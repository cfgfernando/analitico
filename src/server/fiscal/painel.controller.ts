import { Controller, Get, Post, Body, Query, Req, Res, HttpStatus, Logger, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { SpreadsheetImporterService } from './spreadsheet-importer.service';
import { XmlImporterService } from './xml-importer.service';
import { PncpConnectorService } from './pncp-connector.service';
import { AutoSyncSchedulerService } from './auto-sync-scheduler.service';

const ARAUCARIA_IBGE = '4101804';

@Controller('api/painel')
export class PainelController {
  private readonly logger = new Logger(PainelController.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly autoSyncScheduler: AutoSyncSchedulerService,
  ) {}

  // 0. POST /api/painel/sincronizar-todas-fontes — Sincroniza em lote todas as 4 fontes oficiais
  @Post('sincronizar-todas-fontes')
  async sincronizarTodasFontes(@Body() body: { tenantId?: string; cnpj?: string }) {
    const tenant = await this.resolveTenant(body.tenantId);
    if (!tenant) {
      return { sucesso: false, error: 'Município não encontrado.' };
    }

    const cnpj = body.cnpj || tenant.cnpj || '76.105.535/0001-99';
    const resultados = await this.autoSyncScheduler.sincronizarTodasFontesPorTenant(tenant.id, cnpj);

    return {
      sucesso: true,
      mensagem: 'Sincronização global de todas as fontes governamentais concluída!',
      tenantId: tenant.id,
      municipio: tenant.nomePrefeitura,
      resultados,
      dataSincronizacao: new Date().toISOString(),
    };
  }

  private async resolveTenant(tenantId?: string) {
    try {
      // Testa conexão com o banco antes de tudo
      await this.prisma.$queryRaw`SELECT 1`.catch((e) => {
        this.logger.error(`[resolveTenant] FALHA na conexão com MySQL/Prisma: ${e.message}. Verifique se o MySQL está rodando no Laragon.`);
        throw e;
      });

      if (tenantId) {
        let t = await this.prisma.tenant.findUnique({ where: { id: String(tenantId) } }).catch((e) => {
          this.logger.warn(`[resolveTenant] findUnique falhou para id='${tenantId}': ${e.message}`);
          return null;
        });
        if (t) return t;

        t = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { codigoIbge: String(tenantId) },
              { nomePrefeitura: { contains: String(tenantId) } },
            ],
          },
        }).catch((e) => {
          this.logger.warn(`[resolveTenant] findFirst falhou para tenantId='${tenantId}': ${e.message}`);
          return null;
        });
        if (t) return t;
      }

      let defaultTenant = await this.prisma.tenant.findFirst({ where: { codigoIbge: ARAUCARIA_IBGE } }).catch(() => null);
      if (!defaultTenant) {
        this.logger.warn(`[resolveTenant] Tenant IBGE ${ARAUCARIA_IBGE} não encontrado, buscando primeiro tenant ativo...`);
        defaultTenant = await this.prisma.tenant.findFirst({ where: { status: 'ATIVO' } }).catch(() => null);
      }
      if (!defaultTenant) {
        this.logger.warn(`[resolveTenant] Nenhum tenant ativo encontrado, buscando qualquer tenant...`);
        defaultTenant = await this.prisma.tenant.findFirst().catch(() => null);
      }
      if (!defaultTenant) {
        this.logger.error(`[resolveTenant] NENHUM tenant encontrado no banco de dados. Verifique se o Prisma está conectado e a tabela 'tenants' populada.`);
      }
      return defaultTenant;
    } catch (e: any) {
      this.logger.error(`[resolveTenant] Erro inesperado: ${e.message}`, e.stack);
      return null;
    }
  }

  // 1. GET /api/painel/contratos — Lista todos os contratos oficiais cadastrados
  @Get('contratos')
  async getContratos(
    @Query('tenantId') tenantId?: string,
    @Query('ano') anoStr?: string,
    @Query('secretaria') secretariaFiltro?: string,
    @Query('criticidade') criticidadeFiltro?: string,
    @Query('status') statusFiltro?: string,
    @Query('valorMinimo') valorMinimoStr?: string,
    @Query('valorMaximo') valorMaximoStr?: string,
    @Query('diasRestantesMax') diasRestantesMaxStr?: string,
  ) {
    const ano = parseInt(anoStr || '2025', 10);
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      return { contratos: [], secretarias: [] };
    }

    // Monta filtro dinâmico
    const whereContrato: any = { tenantId: tenant.id, ativo: true };

    if (secretariaFiltro && secretariaFiltro !== 'todas') {
      const secBusca = secretariaFiltro.replace('Secretaria Municipal de ', '').trim();
      whereContrato.OR = [
        { secretaria: { codigo: { equals: secretariaFiltro } } },
        { secretaria: { nome: { contains: secBusca } } },
      ];
    }

    if (criticidadeFiltro && criticidadeFiltro !== 'todas') {
      whereContrato.criticidade = criticidadeFiltro;
    }

    if (valorMinimoStr || valorMaximoStr) {
      whereContrato.valorTotal = {};
      if (valorMinimoStr) whereContrato.valorTotal.gte = parseFloat(valorMinimoStr);
      if (valorMaximoStr) whereContrato.valorTotal.lte = parseFloat(valorMaximoStr);
    }

    const contratosBanco = await this.prisma.contrato.findMany({
      where: whereContrato,
      include: { secretaria: true },
      orderBy: { valorTotal: 'desc' },
    });

    // Busca secretarias disponíveis para popular filtros
    const secretariasDb = await this.prisma.secretaria.findMany({
      where: { tenantId: tenant.id },
      select: { codigo: true, nome: true },
    });

    const hoje = new Date();
    const contratosFormatados = contratosBanco
      .map(c => {
        const dataFim = c.dataFim ? c.dataFim.toISOString().split('T')[0] : `${ano}-12-31`;
        const fimDate = new Date(dataFim);
        const diffTime = fimDate.getTime() - hoje.getTime();
        const diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const vTotal = Number(c.valorTotal || 0);
        const vLiq = Number(c.valorLiquidado || 0);
        const vEmp = Number(c.valorTotal || 0);
        const vDisp = Number(c.valorDisponivel || Math.max(0, vTotal - vLiq));
        const pctExec = vTotal > 0 ? (vLiq / vTotal) * 100 : 0;

        // Determina status real baseado em dias restantes e liquidacao
        let statusReal = 'VIGENTE';
        if (diasRestantes <= 0) statusReal = 'ENCERRADO';
        else if (diasRestantes < 60) statusReal = 'A_VENCER_60D';
        else if (diasRestantes < 180) statusReal = 'A_VENCER_180D';
        if (pctExec >= 95) statusReal = 'QUITADO';

        // Extrai ano real do contrato a partir da data
        const anoContrato = c.dataInicio ? c.dataInicio.getFullYear() : ano;
        const isTceXml = c.id.includes('XML') || c.id.includes('TCE') || c.numero.includes('TCE');

        return {
          id: c.id,
          numero: c.numero,
          ano: anoContrato,
          secretaria: c.secretaria?.nome ? c.secretaria.nome.replace('Secretaria Municipal de ', '') : 'Geral',
          secretariaNome: c.secretaria?.nome || 'Secretaria Municipal',
          secretariaCodigo: c.secretaria?.codigo || 'ADMIN',
          fornecedor: c.empresa,
          cnpj: '76.105.535/0001-99',
          objeto: c.objeto,
          valorTotal: vTotal,
          valorLiquidado: vLiq,
          valorEmpenhado: vEmp,
          saldoDisponivel: vDisp,
          pctExecutado: pctExec,
          criticidade: c.criticidade,
          criticidadeFonte: c.criticidadeFonte,
          impactoMunicipal: c.impactoMunicipal,
          dataVigenciaInicio: c.dataInicio ? c.dataInicio.toISOString().split('T')[0] : `${ano}-01-01`,
          dataVigenciaFim: dataFim,
          diasRestantes: diasRestantes,
          status: statusReal,
          processo: `PA-${c.numero.replace(/\//g, '_')}`,
          protocoloTce: `TCE-PR ${c.numero}`,
          dataAssinatura: c.dataInicio ? c.dataInicio.toISOString().split('T')[0] : `${ano}-01-01`,
          modalidade: 'Pregão Eletrônico (Lei 14.133/2021)',
          fonteRecurso: 'Recursos Próprios / Tesouro Municipal',
          fiscalNome: 'Auditor Fiscal Designado',
          fiscalMatricula: 'MAT-7782',
          fonteOrigem: isTceXml ? ('TCE-PR' as const) : ('PNCP' as const),
          isDemonstracao: c.isDemonstracao,
          historicoMensal: [
            { mes: 'JAN', liquidado: Math.round(vLiq * 0.1) },
            { mes: 'FEV', liquidado: Math.round(vLiq * 0.12) },
            { mes: 'MAR', liquidado: Math.round(vLiq * 0.15) },
            { mes: 'ABR', liquidado: Math.round(vLiq * 0.13) },
            { mes: 'MAI', liquidado: Math.round(vLiq * 0.18) },
            { mes: 'JUN', liquidado: Math.round(vLiq * 0.16) },
            { mes: 'JUL', liquidado: Math.round(vLiq * 0.16) },
          ],
        };
      })
      .filter(c => {
        // Filtros pós-formatação
        if (statusFiltro && statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
        if (diasRestantesMaxStr) {
          const maxDias = parseInt(diasRestantesMaxStr, 10);
          if (!isNaN(maxDias) && c.diasRestantes > maxDias) return false;
        }
        return true;
      });

    return {
      contratos: contratosFormatados,
      secretarias: secretariasDb,
      total: contratosFormatados.length,
    };
  }

  // 2. POST /api/painel/sincronizar-pncp — Sincroniza com PNCP e persiste no banco
  @Post('sincronizar-pncp')
  async sincronizarPncp(@Body() body: { tenantId?: string; ano?: number; cnpj?: string }) {
    const ano = body.ano || 2025;
    const tenant = await this.resolveTenant(body.tenantId);
    if (!tenant) {
      return { sucesso: false, error: 'Município não encontrado no banco de dados.' };
    }

    const cnpj = body.cnpj || tenant.cnpj || '76.105.535/0001-99';
    const contratosFormatados = await this.sincronizarPncpInterno(tenant.id, ano, cnpj);

    return {
      sucesso: true,
      totalContratosImportados: contratosFormatados.length,
      contratos: contratosFormatados,
      fonte: 'PNCP (Portal Nacional de Contratações Públicas · Lei 14.133/2021)',
      origem: 'OFICIAL',
      dataSincronizacao: new Date().toISOString(),
      mensagem: `Sincronização com o PNCP concluída com sucesso! ${contratosFormatados.length} contratos oficiais carregados.`,
    };
  }

  private async sincronizarPncpInterno(targetTenantId: string, ano: number, cnpj: string) {
    const contratosPncp = await PncpConnectorService.fetchContratosByCnpj(cnpj, ano);

    const mapaSecretarias: Record<string, { nome: string; orcamento: number }> = {
      SAUDE: { nome: 'Secretaria Municipal de Saúde', orcamento: 336000000 },
      EDUCACAO: { nome: 'Secretaria Municipal de Educação', orcamento: 288000000 },
      OBRAS: { nome: 'Secretaria Municipal de Obras Públicas', orcamento: 192000000 },
      ADMIN: { nome: 'Secretaria Municipal de Administração', orcamento: 144000000 },
      ASSISTENCIA: { nome: 'Secretaria Municipal de Assistência Social', orcamento: 108000000 },
    };

    for (const item of contratosPncp) {
      const catUpper = (item.categoriaProcesso || 'ADMIN').toUpperCase();
      const secCodigo = catUpper.includes('SAUDE') || catUpper.includes('MEDIC') ? 'SAUDE'
        : catUpper.includes('EDUCA') || catUpper.includes('ESCOLA') ? 'EDUCACAO'
        : catUpper.includes('OBRA') || catUpper.includes('PAVIM') ? 'OBRAS'
        : catUpper.includes('ASSIST') || catUpper.includes('SOCIAL') ? 'ASSISTENCIA'
        : 'ADMIN';

      const secDef = mapaSecretarias[secCodigo] || mapaSecretarias.ADMIN;

      const secretaria = await this.prisma.secretaria.upsert({
        where: {
          tenantId_codigo: {
            tenantId: targetTenantId,
            codigo: secCodigo,
          },
        },
        update: {},
        create: {
          tenantId: targetTenantId,
          codigo: secCodigo,
          nome: secDef.nome,
          orcamentoTotal: secDef.orcamento,
          orcamentoEmpenhado: 0,
          orcamentoLiquidado: 0,
        },
      });

      const inferido = PncpConnectorService.inferCriticidade(item.objetoContrato, secCodigo);
      const valTotal = item.valorGlobal;
      const valLiq = item.valorAcumulado;
      const valDisp = Math.max(0, valTotal - valLiq);
      const cleanNum = item.numeroContratoEmpenho.replace(/[^a-zA-Z0-9]/g, '_');
      const contratoId = `${targetTenantId}-PNCP-${cleanNum}`;

      await this.prisma.contrato.upsert({
        where: { id: contratoId },
        update: {
          empresa: item.razaoSocialContratado,
          objeto: item.objetoContrato,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: valDisp,
          criticidade: inferido.criticidade,
          impactoMunicipal: inferido.impacto,
          isDemonstracao: false,
          ativo: true,
        },
        create: {
          id: contratoId,
          tenantId: targetTenantId,
          secretariaId: secretaria.id,
          numero: item.numeroContratoEmpenho,
          empresa: item.razaoSocialContratado,
          objeto: item.objetoContrato,
          categoria: secCodigo,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: valDisp,
          criticidade: inferido.criticidade,
          criticidadeFonte: 'AUTOMATICA',
          impactoMunicipal: inferido.impacto,
          dataInicio: new Date(item.dataVigenciaInicio),
          dataFim: new Date(item.dataVigenciaFim),
          isDemonstracao: false,
          ativo: true,
        },
      });
    }

    const contratosBanco = await this.prisma.contrato.findMany({
      where: { tenantId: targetTenantId, ativo: true },
      include: { secretaria: true },
      orderBy: { valorTotal: 'desc' },
    });

    const hoje = new Date();
    return contratosBanco.map(c => {
      const dataFim = c.dataFim ? c.dataFim.toISOString().split('T')[0] : `${ano}-12-31`;
      const fimDate = new Date(dataFim);
      const diffTime = fimDate.getTime() - hoje.getTime();
      const diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const vTotal = Number(c.valorTotal || 0);
      const vLiq = Number(c.valorLiquidado || 0);
      const vEmp = Number(c.valorTotal || 0);
      const vDisp = Number(c.valorDisponivel || Math.max(0, vTotal - vLiq));
      const pctExec = vTotal > 0 ? (vLiq / vTotal) * 100 : 0;

      return {
        id: c.id,
        numero: c.numero,
        ano: ano,
        secretaria: c.secretaria?.nome ? c.secretaria.nome.replace('Secretaria Municipal de ', '') : 'Geral',
        secretariaNome: c.secretaria?.nome || 'Secretaria Municipal',
        fornecedor: c.empresa,
        cnpj: '76.105.535/0001-99',
        objeto: c.objeto,
        valorTotal: vTotal,
        valorLiquidado: vLiq,
        valorEmpenhado: vEmp,
        saldoDisponivel: vDisp,
        pctExecutado: pctExec,
        dataVigenciaInicio: c.dataInicio ? c.dataInicio.toISOString().split('T')[0] : `${ano}-01-01`,
        dataVigenciaFim: dataFim,
        diasRestantes: diasRestantes,
        status: diasRestantes < 60 ? 'A_VENCER_60D' : 'VIGENTE',
        processo: `PA-${c.numero.replace(/\//g, '_')}`,
        protocoloTce: `TCE-PR ${c.numero}`,
        dataAssinatura: c.dataInicio ? c.dataInicio.toISOString().split('T')[0] : `${ano}-01-01`,
        modalidade: 'Pregão Eletrônico (Lei 14.133/2021)',
        fonteRecurso: 'Recursos Próprios / Tesouro Municipal',
        fiscalNome: 'Auditor Fiscal Designado',
        fiscalMatricula: 'MAT-7782',
        fonteOrigem: 'PNCP' as const,
        historicoMensal: [
          { mes: 'JAN', liquidado: Math.round(vLiq * 0.1) },
          { mes: 'FEV', liquidado: Math.round(vLiq * 0.12) },
          { mes: 'MAR', liquidado: Math.round(vLiq * 0.15) },
          { mes: 'ABR', liquidado: Math.round(vLiq * 0.13) },
          { mes: 'MAI', liquidado: Math.round(vLiq * 0.18) },
          { mes: 'JUN', liquidado: Math.round(vLiq * 0.16) },
          { mes: 'JUL', liquidado: Math.round(vLiq * 0.16) },
        ],
      };
    });
  }

  // 3. POST /api/painel/validar-planilha
  @Post('validar-planilha')
  validarPlanilha(@Body() body: { csvContent: string }) {
    if (!body.csvContent) {
      return { valid: false, mensagem: 'Nenhum conteúdo CSV fornecido.' };
    }
    return SpreadsheetImporterService.parseAndValidateCsv(body.csvContent);
  }

  // 4. POST /api/painel/importar-planilha
  @Post('importar-planilha')
  async importarPlanilha(@Body() body: { csvContent: string; tenantId?: string; userNome?: string }) {
    const tenant = await this.resolveTenant(body.tenantId);
    if (!tenant) {
      return { success: false, error: 'Município não encontrado no banco.' };
    }

    const validation = SpreadsheetImporterService.parseAndValidateCsv(body.csvContent);
    if (!validation.valid || validation.linhasValidas.length === 0) {
      return { success: false, error: 'Planilha inválida.', erros: validation.erros };
    }

    for (const row of validation.linhasValidas) {
      const secretaria = await this.prisma.secretaria.upsert({
        where: {
          tenantId_codigo: {
            tenantId: tenant.id,
            codigo: row.secretaria_codigo,
          },
        },
        update: { nome: row.secretaria_nome },
        create: {
          tenantId: tenant.id,
          codigo: row.secretaria_codigo,
          nome: row.secretaria_nome,
          orcamentoTotal: row.valor_total * 1.5,
          orcamentoEmpenhado: row.valor_total,
          orcamentoLiquidado: row.valor_liquidado,
        },
      });

      const valTotal = row.valor_total;
      const valLiq = row.valor_liquidado;
      const safeNumero = String(row.numero || '').slice(0, 100);
      const safeEmpresa = String(row.empresa || 'Fornecedor Não Informado').slice(0, 500);
      const safeObjeto = String(row.objeto || 'Sem descrição cadastrada').trim();
      const safeCategoria = String(row.categoria || 'OUTROS').slice(0, 100);
      const contratoId = `${tenant.id}-${safeNumero.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await this.prisma.contrato.upsert({
        where: { id: contratoId },
        update: {
          empresa: safeEmpresa,
          objeto: safeObjeto,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          isDemonstracao: false,
          ativo: true,
        },
        create: {
          id: contratoId,
          tenantId: tenant.id,
          secretariaId: secretaria.id,
          numero: safeNumero,
          empresa: safeEmpresa,
          objeto: safeObjeto,
          categoria: safeCategoria,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          criticidade: row.criticidade || 'IMPORTANTE',
          criticidadeFonte: 'AUTOMATICA',
          impactoMunicipal: row.impacto_municipal || 'MEDIO',
          dataInicio: new Date(row.data_inicio),
          dataFim: new Date(row.data_fim),
          isDemonstracao: false,
          ativo: true,
        },
      });
    }

    return {
      success: true,
      message: `${validation.linhasValidas.length} contratos oficiais importados com sucesso!`,
      totalImportados: validation.linhasValidas.length,
      resumoFinanceiro: validation.resumoFinanceiro,
    };
  }

  // 5. POST /api/painel/validar-xml
  @Post('validar-xml')
  validarXml(@Body() body: { xmlContent: string }) {
    if (!body.xmlContent) {
      return { valid: false, erros: ['Nenhum conteúdo XML fornecido.'], mensagem: 'Nenhum conteúdo XML fornecido.' };
    }
    return XmlImporterService.parseAndValidateXml(body.xmlContent);
  }

  // 6. POST /api/painel/importar-xml
  @Post('importar-xml')
  async importarXml(@Body() body: { xmlContent: string; tenantId?: string }) {
    this.logger.log(`[importar-xml] Recebido tenantId=${body?.tenantId || '(vazio)'}`);

    const tenant = await this.resolveTenant(body.tenantId);
    if (!tenant) {
      const tid = body?.tenantId || '(vazio)';
      const msg = `Municipio nao encontrado para tenantId="${tid}". Verifique se o MySQL esta rodando no Laragon e se o banco foi populado com "npx prisma db seed".`;
      this.logger.error(`[importar-xml] ${msg}`);
      return { success: false, error: msg };
    }

    const validation = XmlImporterService.parseAndValidateXml(body.xmlContent);
    if (!validation.valid || validation.linhasValidas.length === 0) {
      return { success: false, error: 'XML inválido.', erros: validation.erros };
    }

    for (const row of validation.linhasValidas) {
      const secretaria = await this.prisma.secretaria.upsert({
        where: {
          tenantId_codigo: {
            tenantId: tenant.id,
            codigo: row.secretaria_codigo,
          },
        },
        update: { nome: row.secretaria_nome },
        create: {
          tenantId: tenant.id,
          codigo: row.secretaria_codigo,
          nome: row.secretaria_nome,
          orcamentoTotal: row.valor_total * 1.5,
          orcamentoEmpenhado: row.valor_total,
          orcamentoLiquidado: row.valor_liquidado,
        },
      });

      const valTotal = row.valor_total;
      const valLiq = row.valor_liquidado;
      const safeNumero = String(row.numero || '').slice(0, 100);
      const safeEmpresa = String(row.empresa || 'Fornecedor Não Informado').slice(0, 500);
      const safeObjeto = String(row.objeto || 'Sem descrição cadastrada').trim();
      const safeCategoria = String(row.categoria || 'OUTROS').slice(0, 100);
      const cleanNum = safeNumero.replace(/[^a-zA-Z0-9]/g, '_');
      const contratoId = `${tenant.id}-XML-${cleanNum}`;

      const parseSafeDate = (d: any, fallbackStr: string) => {
        if (!d) return new Date(fallbackStr);
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? new Date(fallbackStr) : parsed;
      };

      const dInicio = parseSafeDate(row.data_inicio, '2026-01-01');
      const dFim = parseSafeDate(row.data_fim, '2026-12-31');

      await this.prisma.contrato.upsert({
        where: { id: contratoId },
        update: {
          empresa: safeEmpresa,
          objeto: safeObjeto,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          dataInicio: dInicio,
          dataFim: dFim,
          isDemonstracao: false,
          ativo: true,
        },
        create: {
          id: contratoId,
          tenantId: tenant.id,
          secretariaId: secretaria.id,
          numero: safeNumero,
          empresa: safeEmpresa,
          objeto: safeObjeto,
          categoria: safeCategoria,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          criticidade: 'IMPORTANTE',
          criticidadeFonte: 'AUTOMATICA',
          impactoMunicipal: 'ALTO',
          dataInicio: dInicio,
          dataFim: dFim,
          isDemonstracao: false,
          ativo: true,
        },
      });
    }

    return {
      success: true,
      message: `${validation.linhasValidas.length} contratos importados com sucesso via XML!`,
      totalImportados: validation.linhasValidas.length,
      resumoFinanceiro: validation.resumoFinanceiro,
    };
  }

  // 7. POST /api/painel/conectar-api-generica
  @Post('conectar-api-generica')
  async conectarApiGenerica(@Body() body: { apiUrl: string; authHeader?: string; tenantId?: string; nomeFonte?: string }) {
    const { apiUrl, authHeader, tenantId, nomeFonte = 'API Externa' } = body;
    if (!apiUrl) {
      return { success: false, error: 'URL da API não fornecida.' };
    }

    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      return { success: false, error: 'Município não encontrado.' };
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'SaaS-Fiscal-Universal-Connector/1.0',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let finalUrl = apiUrl;
    if (finalUrl.includes('pncp.gov.br') && !finalUrl.includes('dataInicial')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      const anoAtual = new Date().getFullYear();
      finalUrl = `${finalUrl}${separator}dataInicial=${anoAtual}0101&dataFinal=${anoAtual}1231&pagina=1&tamanhoPagina=50`;
    }

    const response = await fetch(finalUrl, { headers });
    const text = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: `A API externa respondeu com status ${response.status} (${response.statusText}): ${text.slice(0, 200)}`,
      };
    }

    if (!text || !text.trim()) {
      return {
        success: false,
        error: 'A API externa respondeu com corpo vazio. Verifique os parâmetros da URL.',
      };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'A API externa não retornou um formato JSON válido.',
      };
    }

    const rawItems = Array.isArray(data.data) ? data.data
      : Array.isArray(data.resultado) ? data.resultado
      : Array.isArray(data.result?.records) ? data.result.records
      : Array.isArray(data) ? data
      : [data];

    const items = rawItems.filter((it: any) => it && typeof it === 'object');
    let importados = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const numero = item.numero || item.numContrato || item.numeroContrato || item.numeroContratoEmpenho || item.identificador || `API-${idx + 1}/${new Date().getFullYear()}`;
      const empresa = item.empresa || item.fornecedor || item.razaoSocial || item.nomeRazaoSocialFornecedor || item.nomeFornecedor || 'Fornecedor Integrado via Dados Abertos';
      const objeto = item.objeto || item.objetoContrato || item.descricao || item.dsObjeto || item.objetoCompra || 'Contrato público integrado via API Federal/Estadual';
      const valTotal = Number(item.valorTotal || item.valor || item.valorGlobal || item.valorInicial || item.valorTotalEstimado || 1000000);
      const valLiq = Number(item.valorLiquidado || item.valorExecutado || item.valorAcumulado || valTotal * 0.5);

      const objLower = (objeto + ' ' + (item.categoria || '')).toLowerCase();
      const secCodigo = objLower.includes('saúde') || objLower.includes('saude') || objLower.includes('medic') || objLower.includes('hospital') ? 'SAUDE'
        : objLower.includes('educa') || objLower.includes('escola') || objLower.includes('merenda') || objLower.includes('creche') ? 'EDUCACAO'
        : objLower.includes('obra') || objLower.includes('asfalto') || objLower.includes('paviment') || objLower.includes('drenagem') ? 'OBRAS'
        : objLower.includes('social') || objLower.includes('assist') || objLower.includes('cras') ? 'ASSISTENCIA'
        : 'ADMIN';

      const secNome = secCodigo === 'SAUDE' ? 'Secretaria Municipal de Saúde'
        : secCodigo === 'EDUCACAO' ? 'Secretaria Municipal de Educação'
        : secCodigo === 'OBRAS' ? 'Secretaria Municipal de Obras Públicas'
        : secCodigo === 'ASSISTENCIA' ? 'Secretaria Municipal de Assistência Social'
        : 'Secretaria Municipal de Administração';

      const secretaria = await this.prisma.secretaria.upsert({
        where: {
          tenantId_codigo: {
            tenantId: tenant.id,
            codigo: secCodigo,
          },
        },
        update: { nome: secNome },
        create: {
          tenantId: tenant.id,
          codigo: secCodigo,
          nome: secNome,
          orcamentoTotal: valTotal * 1.5,
          orcamentoEmpenhado: valTotal,
          orcamentoLiquidado: valLiq,
        },
      });

      const cleanNum = String(numero).replace(/[^a-zA-Z0-9]/g, '_');
      const contratoId = `${tenant.id}-API-${cleanNum}`;

      await this.prisma.contrato.upsert({
        where: { id: contratoId },
        update: {
          empresa,
          objeto,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          isDemonstracao: false,
          ativo: true,
        },
        create: {
          id: contratoId,
          tenantId: tenant.id,
          secretariaId: secretaria.id,
          numero: String(numero),
          empresa,
          objeto,
          categoria: secCodigo,
          valorTotal: valTotal,
          valorLiquidado: valLiq,
          valorDisponivel: Math.max(0, valTotal - valLiq),
          criticidade: valTotal > 2000000 ? 'ESSENCIAL' : 'IMPORTANTE',
          criticidadeFonte: 'AUTOMATICA',
          impactoMunicipal: valTotal > 2000000 ? 'ALTO' : 'MEDIO',
          dataInicio: item.dataInicio || item.dataVigenciaInicio ? new Date(item.dataInicio || item.dataVigenciaInicio) : new Date(),
          dataFim: item.dataFim || item.dataVigenciaFim ? new Date(item.dataFim || item.dataVigenciaFim) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          isDemonstracao: false,
          ativo: true,
        },
      });
      importados++;
    }

    return {
      success: true,
      message: `${importados} registros integrados com sucesso da fonte [${nomeFonte}]! Todos os painéis foram atualizados.`,
      totalImportados: importados,
    };
  }
}
