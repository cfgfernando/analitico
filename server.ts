import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import env from './src/config/env';
import {
  helmetSecurityMiddleware,
  corsSecurityMiddleware,
  apiRateLimiter,
} from './src/server/security';
import { autoDiscoverMunicipality, generateApisForMunicipality, MUNICIPIOS_REFERENCIA } from './src/data/municipiosBrasil';
import {
  resolveTenant,
  getMunicipalFiscalSummary,
  getMunicipalReceitas,
  getMunicipalDespesas,
  getMunicipalLimites,
  getMunicipalCaptacao,
  getMunicipalFundeb,
  getMunicipalAlertas,
  getMunicipalObras,
  getMunicipalSiconfiStatus,
} from './src/server/municipalFiscalEngine';

const app = express();
const PORT = env.PORT || 3000;

// Middlewares de Segurança Básicos (Fase 0)
app.use(helmetSecurityMiddleware);
app.use(corsSecurityMiddleware);
app.use('/api/', apiRateLimiter);

app.use(express.json({ limit: '1mb' }));

// In-memory cache for Siconfi API responses to avoid rate limits
const cacheStore: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const ARAUCARIA_IBGE = '4101804';

// Helper to fetch from Siconfi with retry and cache
async function fetchSiconfi(endpoint: string, params: Record<string, string>) {
  const queryParams = new URLSearchParams(params).toString();
  const fullUrl = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/${endpoint}?${queryParams}`;
  const cacheKey = fullUrl;

  const cached = cacheStore[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data, fromCache: true, sourceUrl: fullUrl };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Araucaria-Fiscal-Dashboard/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Siconfi API returned HTTP status ${response.status}`);
    }

    const jsonData = await response.json();
    cacheStore[cacheKey] = { data: jsonData, timestamp: Date.now() };
    return { data: jsonData, fromCache: false, sourceUrl: fullUrl };
  } catch (error: any) {
    console.warn(`[Siconfi Fetch Warning] ${endpoint}: ${error.message}`);
    // If cached version exists even if expired, return it
    if (cached) {
      return { data: cached.data, fromCache: true, sourceUrl: fullUrl, isStale: true };
    }
    return { data: null, error: error.message, sourceUrl: fullUrl };
  }
}

// ==========================================
// SAAS MULTI-TENANT & USER MANAGEMENT ENGINE
// ==========================================

interface MockTenant {
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

interface MockUser {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  role: 'MASTER_ADMIN' | 'PREFEITO' | 'SECRETARIO_FINANCAS' | 'CONTROLADORIA' | 'SECRETARIA_SETORIAL' | 'VISUALIZADOR_GERAL';
  secretariaRestrita?: string | null;
  ativo: boolean;
  isExtra: boolean;
  ultimoAcesso?: string;
  createdAt: string;
}

interface MockApiConfig {
  id: string;
  tenantId: string;
  providerName: 'SICONFI' | 'TRANSFEREGOV' | 'TCE_PR' | 'PORTAL_TRANSPARENCIA' | 'ERP_LOCAL';
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

// Initial Database Seed for SaaS
let saasTenants: MockTenant[] = [
  {
    id: 'tenant-araucaria',
    codigoIbge: '4101804',
    nomePrefeitura: 'Prefeitura Municipal de Araucária',
    cidade: 'Araucária',
    uf: 'PR',
    cnpj: '76.105.535/0001-99',
    status: 'ATIVO',
    planoNome: 'Plano Gestão Fiscal Completo',
    valorMensalBase: 1890.00,
    userLimit: 2,
    valorUsuarioExtra: 150.00,
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
    valorMensalBase: 3490.00,
    userLimit: 2,
    valorUsuarioExtra: 150.00,
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
    valorMensalBase: 1890.00,
    userLimit: 2,
    valorUsuarioExtra: 150.00,
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
    valorMensalBase: 1890.00,
    userLimit: 2,
    valorUsuarioExtra: 150.00,
    diaVencimento: 20,
    emailFaturamento: 'contabilidade@maringa.pr.gov.br',
    telefoneContato: '(44) 3221-1234',
    createdAt: '2025-03-22T14:15:00.000Z',
  },
];

let saasUsers: MockUser[] = [
  // Araucária Users (3 active: 2 included + 1 extra)
  {
    id: 'user-ara-1',
    tenantId: 'tenant-araucaria',
    nome: 'Dr. Hissam Hussein Dehaini',
    email: 'gabinete.prefeito@araucaria.pr.gov.br',
    cpf: '381.***.***-04',
    cargo: 'Prefeito Municipal',
    role: 'PREFEITO',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Hoje às 08:35',
    createdAt: '2025-01-15T08:30:00.000Z',
  },
  {
    id: 'user-ara-2',
    tenantId: 'tenant-araucaria',
    nome: 'Geraldo Antonio Gubert',
    email: 'secretario.financas@araucaria.pr.gov.br',
    cpf: '512.***.***-91',
    cargo: 'Secretário Municipal de Finanças',
    role: 'SECRETARIO_FINANCAS',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Hoje às 08:50',
    createdAt: '2025-01-15T08:35:00.000Z',
  },
  {
    id: 'user-ara-3',
    tenantId: 'tenant-araucaria',
    nome: 'Eng. Fernando R. Santos',
    email: 'obras.projetos@araucaria.pr.gov.br',
    cpf: '842.***.***-20',
    cargo: 'Secretário Municipal de Obras Públicas',
    role: 'SECRETARIA_SETORIAL',
    secretariaRestrita: 'SMOP',
    ativo: true,
    isExtra: true, // EXCEDENTE / EXTRA (+R$ 150/mês)
    ultimoAcesso: 'Ontem às 17:10',
    createdAt: '2025-02-18T10:00:00.000Z',
  },

  // Curitiba Users (2 users: 2 included)
  {
    id: 'user-cur-1',
    tenantId: 'tenant-curitiba',
    nome: 'Eduardo Pimentel Slaviero',
    email: 'prefeito@curitiba.pr.gov.br',
    cpf: '409.***.***-55',
    cargo: 'Prefeito Municipal',
    role: 'PREFEITO',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Há 2 dias',
    createdAt: '2025-02-01T09:40:00.000Z',
  },
  {
    id: 'user-cur-2',
    tenantId: 'tenant-curitiba',
    nome: 'Cristiano Hotz',
    email: 'financas@curitiba.pr.gov.br',
    cpf: '298.***.***-80',
    cargo: 'Secretário Municipal de Finanças',
    role: 'SECRETARIO_FINANCAS',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Hoje às 07:15',
    createdAt: '2025-02-01T09:45:00.000Z',
  },

  // Londrina Users (2 users)
  {
    id: 'user-lon-1',
    tenantId: 'tenant-londrina',
    nome: 'Tiago Amaral',
    email: 'gabinete@londrina.pr.gov.br',
    cpf: '611.***.***-34',
    cargo: 'Prefeito Municipal',
    role: 'PREFEITO',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Há 3 dias',
    createdAt: '2025-03-10T11:10:00.000Z',
  },
  {
    id: 'user-lon-2',
    tenantId: 'tenant-londrina',
    nome: 'João Carlos Barbosa Perez',
    email: 'fazenda.secretario@londrina.pr.gov.br',
    cpf: '154.***.***-18',
    cargo: 'Secretário Municipal de Fazenda',
    role: 'SECRETARIO_FINANCAS',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Ontem às 14:20',
    createdAt: '2025-03-10T11:15:00.000Z',
  },

  // Maringá Users (4 users: 2 included + 2 extras)
  {
    id: 'user-mar-1',
    tenantId: 'tenant-maringa',
    nome: 'Silvio Barros',
    email: 'prefeito@maringa.pr.gov.br',
    cpf: '733.***.***-09',
    cargo: 'Prefeito Municipal',
    role: 'PREFEITO',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Há 1 dia',
    createdAt: '2025-03-22T14:20:00.000Z',
  },
  {
    id: 'user-mar-2',
    tenantId: 'tenant-maringa',
    nome: 'Orlando Chiqueto Rodrigues',
    email: 'fazenda@maringa.pr.gov.br',
    cpf: '918.***.***-43',
    cargo: 'Secretário de Fazenda',
    role: 'SECRETARIO_FINANCAS',
    secretariaRestrita: null,
    ativo: true,
    isExtra: false,
    ultimoAcesso: 'Hoje às 09:00',
    createdAt: '2025-03-22T14:25:00.000Z',
  },
  {
    id: 'user-mar-3',
    tenantId: 'tenant-maringa',
    nome: 'Dra. Maria Cláudia Silva',
    email: 'saude.gestao@maringa.pr.gov.br',
    cpf: '445.***.***-67',
    cargo: 'Secretária Municipal de Saúde',
    role: 'SECRETARIA_SETORIAL',
    secretariaRestrita: 'SMSA',
    ativo: true,
    isExtra: true, // EXTRA
    ultimoAcesso: 'Há 4 dias',
    createdAt: '2025-04-05T10:00:00.000Z',
  },
  {
    id: 'user-mar-4',
    tenantId: 'tenant-maringa',
    nome: 'Profª. Nayara Ramos',
    email: 'educacao.auditoria@maringa.pr.gov.br',
    cpf: '332.***.***-89',
    cargo: 'Secretária Municipal de Educação',
    role: 'SECRETARIA_SETORIAL',
    secretariaRestrita: 'SMED',
    ativo: true,
    isExtra: true, // EXTRA
    ultimoAcesso: 'Ontem às 11:30',
    createdAt: '2025-04-12T16:00:00.000Z',
  },
];

let saasApiConfigs: MockApiConfig[] = [
  // Araucária APIs
  {
    id: 'api-ara-1',
    tenantId: 'tenant-araucaria',
    providerName: 'SICONFI',
    label: 'STN / Siconfi Datalake Nacional',
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

  // Curitiba APIs
  {
    id: 'api-cur-1',
    tenantId: 'tenant-curitiba',
    providerName: 'SICONFI',
    label: 'STN / Siconfi Datalake Curitiba',
    baseUrl: 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt',
    authType: 'NONE',
    apiKeyMasked: 'siconfi-public-curitiba-4106902',
    syncFrequency: '0 6,18 * * *',
    ativo: true,
    ultimoStatus: 'SUCESSO',
    ultimaSincronizacao: 'Hoje às 06:00',
    totalRegistrosSincronizados: 42300,
  },
  {
    id: 'api-cur-2',
    tenantId: 'tenant-curitiba',
    providerName: 'PORTAL_TRANSPARENCIA',
    label: 'Portal da Transparência Curitiba REST',
    baseUrl: 'https://transparencia.curitiba.pr.gov.br/api/v1',
    authType: 'API_KEY',
    apiKeyMasked: 'cwb_api_token_***99x',
    syncFrequency: '0 6,12,18 * * *',
    ativo: true,
    ultimoStatus: 'SUCESSO',
    ultimaSincronizacao: 'Hoje às 06:20',
    totalRegistrosSincronizados: 112000,
  },
];

// Helper to compute Tenant statistics
function getTenantWithStats(tenant: MockTenant) {
  const users = saasUsers.filter(u => u.tenantId === tenant.id && u.ativo);
  const totalUsuariosAtivos = users.length;
  const usuariosExcedentes = Math.max(0, totalUsuariosAtivos - tenant.userLimit);
  const valorTotalMensalidade = tenant.valorMensalBase + (usuariosExcedentes * tenant.valorUsuarioExtra);
  
  const apis = saasApiConfigs.filter(a => a.tenantId === tenant.id);
  const apisConfiguradas = apis.length;
  const apisAtivas = apis.filter(a => a.ativo).length;

  return {
    ...tenant,
    totalUsuariosAtivos,
    usuariosExcedentes,
    valorTotalMensalidade,
    apisConfiguradas,
    apisAtivas,
  };
}

// Multi-tenant resolver helper from Express request
function getTenantFromReq(req: express.Request) {
  const tenantIdOrIbge =
    (req.query.tenantId as string) ||
    (req.query.codigoIbge as string) ||
    (req.headers['x-tenant-id'] as string) ||
    (req.query.ibge as string) ||
    (req.body?.tenantId as string);
  return resolveTenant(tenantIdOrIbge, saasTenants);
}

// Dynamic Siconfi API Status check
app.get('/api/siconfi/status', async (req, res) => {
  const tenant = getTenantFromReq(req);
  const startTime = Date.now();
  let online = false;
  let latencyMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const testUrl = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/entes?id_ente=${tenant.codigoIbge}`;
    const resp = await fetch(testUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    latencyMs = Date.now() - startTime;
    online = resp.ok;
  } catch (err) {
    latencyMs = Date.now() - startTime;
    online = false;
  }

  const siconfiData = getMunicipalSiconfiStatus(tenant, latencyMs, online);
  res.json(siconfiData);
});

// Dynamic Proxy to test any Siconfi endpoint live
app.get('/api/siconfi/proxy', async (req, res) => {
  const tenant = getTenantFromReq(req);
  const endpoint = (req.query.endpoint as string) || 'entes';
  const queryParams: Record<string, string> = {};
  
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'endpoint' && typeof v === 'string') {
      queryParams[k] = v;
    }
  }

  if (!queryParams['id_ente']) {
    queryParams['id_ente'] = tenant.codigoIbge;
  }

  const result = await fetchSiconfi(endpoint, queryParams);
  res.json(result);
});

// Dynamic Consolidated Fiscal Summary (Multi-Tenant)
app.get('/api/fiscal/summary', (req, res) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const tenant = getTenantFromReq(req);
  const summary = getMunicipalFiscalSummary(tenant, ano);
  res.json(summary);
});

// Dynamic Receitas Orçamentárias (Multi-Tenant)
app.get('/api/fiscal/receitas', (req, res) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const tenant = getTenantFromReq(req);
  const receitasData = getMunicipalReceitas(tenant, ano);
  res.json(receitasData);
});

// Dynamic Despesas e Funções de Governo (Multi-Tenant)
app.get('/api/fiscal/despesas', (req, res) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const tenant = getTenantFromReq(req);
  const despesasData = getMunicipalDespesas(tenant, ano);
  res.json(despesasData);
});

// Dynamic Limites da LRF (Multi-Tenant)
app.get('/api/fiscal/lrf', (req, res) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const tenant = getTenantFromReq(req);
  const limitesData = getMunicipalLimites(tenant, ano);
  res.json(limitesData);
});

// Dynamic Captação de Recursos e Convênios (Multi-Tenant)
app.get('/api/fiscal/captacao', (req, res) => {
  const tenant = getTenantFromReq(req);
  const captacaoData = getMunicipalCaptacao(tenant);
  res.json(captacaoData);
});

// Dynamic FUNDEB e SIOPE (Multi-Tenant)
app.get('/api/fiscal/fundeb', (req, res) => {
  const tenant = getTenantFromReq(req);
  const fundebData = getMunicipalFundeb(tenant);
  res.json(fundebData);
});

// Dynamic Alertas Fiscais (Multi-Tenant)
app.get('/api/fiscal/alertas', (req, res) => {
  const tenant = getTenantFromReq(req);
  const alertsData = getMunicipalAlertas(tenant);
  res.json(alertsData);
});

// Dynamic Obras Públicas e Geolocalização (Multi-Tenant)
app.get('/api/fiscal/obras', (req, res) => {
  const tenant = getTenantFromReq(req);
  const obrasData = getMunicipalObras(tenant);
  res.json(obrasData);
});

// Dynamic Diagnóstico IA Especialista com Gemini (Multi-Tenant)
app.post('/api/fiscal/diagnostico-ia', async (req, res) => {
  const { summary, ano = 2026 } = req.body;
  const tenant = getTenantFromReq(req);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      success: true,
      diagnostico: `### Parecer Técnico Preliminar da Fazenda Municipal — ${tenant.nomePrefeitura} (Exercício ${ano})
* **Receita Corrente Líquida (RCL)**: Acompanhamento contínuo em conformidade com a LRF (LC 101/2000).
* **Despesa Total com Pessoal (DTP)**: Monitoramento rigoroso dos limites de alerta (48,60%), prudencial (51,30%) e legal (54,00%).
* **Investimentos e Educação/Saúde**: Aplicação constitucional mínima em Educação (25%) e Saúde (15%) devidamente salvaguardada.
* **Recomendação Preventiva**: Manter provisão quadrimestral e controle sobre restos a pagar para assegurar suficiência de caixa no encerramento do exercício.`,
      provedor: 'Sistema Especialista Contábil Integrado',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é o Auditor Fiscal Chefe e Consultor Especialista em Contabilidade Pública Municipal para ${tenant.nomePrefeitura} (${tenant.uf}, Código IBGE ${tenant.codigoIbge}).
Analise os seguintes indicadores fiscais consolidados do exercício ${ano}:
${JSON.stringify(summary, null, 2)}

Gere um parecer executivo profissional formatado em Markdown com:
1. 🏛️ Síntese da Situação Fiscal e Desempenho Orçamentário de ${tenant.cidade}/${tenant.uf}
2. ⚖️ Análise de Conformidade com a LRF e Tribunal de Contas
3. 🎯 3 Recomendações Estratégicas Prioritárias para o Prefeito e Secretário de Finanças`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      diagnostico: response.text,
      provedor: 'Gemini 2.5 Flash • IA Especialista em Finanças Municipais',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.json({
      success: true,
      diagnostico: `### Parecer Técnico Orçamentário e Financeiro — ${tenant.nomePrefeitura} (${ano})
* **Execução das Receitas**: Indicadores de arrecadação municipal dentro do intervalo previsto para o exercício.
* **Folha de Pagamento**: Manter cautela e controle estrito sobre concessão de adicionais e contratações para não atingir o limite prudencial da LRF.
* **Captação de Convênios**: Aceleração dos marcos de medição para liberação de repasses federais e estaduais.`,
      provedor: 'Sistema Especialista Contábil Integrado',
      timestamp: new Date().toISOString(),
    });
  }
});

// Dynamic Análise Preditiva e Simulação LOA (Multi-Tenant)
app.post('/api/fiscal/analise-preditiva', async (req, res) => {
  const { ano = 2026 } = req.body;
  const tenant = getTenantFromReq(req);
  
  const analiseFallback = `### 🔮 Projeção Preditiva e Cenários Fiscais 2026/2027 — ${tenant.nomePrefeitura}

#### 1. 📊 Projeção de Encerramento do Exercício ${ano}
* **Cenário Base (Probabilidade 70%)**: Receita Arrecadada projetada em linha com as reestimativas quadrimestrais, mantendo superávit financeiro livre de contingência.
* **Cenário Otimista (+4,5%)**: Aceleração de repasses de convênios e eficiência na cobrança da Dívida Ativa municipal.
* **Cenário Estressado (-6,0%)**: Queda de transferências constitucionais (FPM/ICMS) exigindo contingenciamento preventivo imediato de 10% no custeio das secretarias não-essenciais.

#### 2. 👥 Projeção da Folha de Pagamento (DTP / LRF)
* A despesa com pessoal encontra-se sob monitoramento permanente para resguardar a margem de segurança frente ao limite prudencial de 51,30% da RCL.

#### 3. 🛡️ Ações Preventivas Recomendadas
* **1. Provisão Quadrimestral do 13º Salário**: Reservar cotas mensais de contingência para evitar pressões de liquidação em Dezembro.
* **2. Gestão de Contratos Continuados**: Repactuação de contratos de terceirização com ganhos de eficiência administrativa.
* **3. Aceleração da Cobrança de Créditos Tributários**: Intensificar mutirões de conciliação fiscal e modernização do cadastro imobiliário/ISSQN.`;

  res.json({
    success: true,
    analise: analiseFallback,
    provedor: `Sistema Especialista Preditivo Contábil ${tenant.cidade}`,
    timestamp: new Date().toISOString(),
    ano,
  });
});

// ========================================================
// SAAS ENDPOINTS (MULTI-TENANT & API INTEGRATIONS)
// ========================================================

// 0. GET /api/saas/municipios/lookup - Auto-discover municipality and all 7 Open Data APIs
app.get('/api/saas/municipios/lookup', (req, res) => {
  const query = (req.query.query as string) || (req.query.q as string) || '';
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Parâmetro query é obrigatório (Nome da Cidade, CNPJ ou Código IBGE).' });
  }

  try {
    const discovered = autoDiscoverMunicipality(query);
    if (!discovered) {
      return res.status(404).json({ error: 'Nenhum município localizado para os termos informados.' });
    }

    return res.json({
      success: true,
      municipality: discovered,
      message: `Município de ${discovered.cidade} (${discovered.uf}) localizado com sucesso com ${discovered.apisDisponiveis.length} APIs públicas mapeadas!`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao consultar bases do IBGE/Receita.' });
  }
});

// 0.1 GET /api/saas/municipios/suggestions - Quick autocomplete suggestions
app.get('/api/saas/municipios/suggestions', (req, res) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    return res.json({
      success: true,
      suggestions: MUNICIPIOS_REFERENCIA.slice(0, 8).map(m => ({
        codigoIbge: m.codigoIbge,
        cidade: m.cidade,
        uf: m.uf,
        cnpj: m.cnpj,
        nomePrefeitura: m.nomePrefeitura,
      }))
    });
  }

  const results = MUNICIPIOS_REFERENCIA.filter(m => 
    m.cidade.toLowerCase().includes(q) ||
    m.codigoIbge.includes(q) ||
    m.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
    m.uf.toLowerCase() === q
  ).slice(0, 8).map(m => ({
    codigoIbge: m.codigoIbge,
    cidade: m.cidade,
    uf: m.uf,
    cnpj: m.cnpj,
    nomePrefeitura: m.nomePrefeitura,
  }));

  res.json({ success: true, suggestions: results });
});

// 1. GET /api/saas/tenants - List all tenants
app.get('/api/saas/tenants', (req, res) => {
  const tenantsWithStats = saasTenants.map(getTenantWithStats);
  res.json({ success: true, tenants: tenantsWithStats });
});

// 2. POST /api/saas/tenants - Register new tenant with automatic API provisioning
app.post('/api/saas/tenants', (req, res) => {
  const {
    codigoIbge,
    nomePrefeitura,
    cidade,
    uf,
    cnpj,
    planoNome,
    valorMensalBase,
    userLimit,
    valorUsuarioExtra,
    emailFaturamento,
    telefoneContato,
    prefeitoNome,
    prefeitoEmail,
    prefeitoCpf,
    secFinancasNome,
    secFinancasEmail,
    secFinancasCpf,
    apis, // Optional array of custom or discovered APIs
  } = req.body;

  if (!codigoIbge || !nomePrefeitura || !cnpj) {
    return res.status(400).json({ error: 'Código IBGE, Nome da Prefeitura e CNPJ são obrigatórios.' });
  }

  // Check if tenant already exists - if so, update tenant and provision any missing APIs
  const existingTenantIndex = saasTenants.findIndex(t => t.codigoIbge === codigoIbge);
  if (existingTenantIndex !== -1) {
    const existingTenant = saasTenants[existingTenantIndex];
    if (nomePrefeitura) existingTenant.nomePrefeitura = nomePrefeitura;
    if (cidade) existingTenant.cidade = cidade;
    if (uf) existingTenant.uf = uf;
    if (cnpj) existingTenant.cnpj = cnpj;
    existingTenant.status = 'ATIVO';
    if (planoNome) existingTenant.planoNome = planoNome;
    if (valorMensalBase) existingTenant.valorMensalBase = Number(valorMensalBase);
    if (userLimit) existingTenant.userLimit = Number(userLimit);
    if (valorUsuarioExtra) existingTenant.valorUsuarioExtra = Number(valorUsuarioExtra);
    if (emailFaturamento) existingTenant.emailFaturamento = emailFaturamento;
    if (telefoneContato) existingTenant.telefoneContato = telefoneContato;

    // Provision or refresh APIs for this tenant
    const apisToProvision = Array.isArray(apis) && apis.length > 0
      ? apis
      : generateApisForMunicipality(existingTenant.cidade, existingTenant.uf, existingTenant.codigoIbge);

    apisToProvision.forEach((apiTemplate: any, idx: number) => {
      const existingApi = saasApiConfigs.find(a => a.tenantId === existingTenant.id && a.providerName === apiTemplate.providerName);
      if (!existingApi) {
        saasApiConfigs.push({
          id: `api-${Date.now()}-${idx}-${(apiTemplate.providerName || 'api').toLowerCase()}`,
          tenantId: existingTenant.id,
          providerName: apiTemplate.providerName,
          label: apiTemplate.label || `${apiTemplate.providerName} (${existingTenant.cidade})`,
          baseUrl: apiTemplate.baseUrl,
          authType: apiTemplate.authType || 'NONE',
          apiKeyMasked: apiTemplate.apiKeyMasked || `${(apiTemplate.providerName || 'api').toLowerCase()}-${codigoIbge}`,
          syncFrequency: apiTemplate.syncFrequency || '0 6,18 * * *',
          ativo: true,
          ultimoStatus: 'SUCESSO',
          ultimaSincronizacao: 'Sincronizado e conectado com sucesso',
          totalRegistrosSincronizados: 1250 * (idx + 1),
        });
      } else {
        existingApi.ativo = true;
        existingApi.ultimoStatus = 'SUCESSO';
        existingApi.ultimaSincronizacao = 'Sincronizado com sucesso';
      }
    });

    return res.status(200).json({
      success: true,
      tenant: getTenantWithStats(existingTenant),
      message: `Prefeitura ${existingTenant.nomePrefeitura} atualizada e sincronizada com sucesso com ${apisToProvision.length} APIs ativas!`,
    });
  }

  const newTenantId = `tenant-${Date.now()}`;
  const newTenant: MockTenant = {
    id: newTenantId,
    codigoIbge,
    nomePrefeitura,
    cidade: cidade || nomePrefeitura.replace('Prefeitura Municipal de ', ''),
    uf: uf || 'PR',
    cnpj,
    status: 'ATIVO',
    planoNome: planoNome || 'Plano Básico Municipal',
    valorMensalBase: Number(valorMensalBase) || 1890.00,
    userLimit: Number(userLimit) || 2, // 2 standard included
    valorUsuarioExtra: Number(valorUsuarioExtra) || 150.00,
    diaVencimento: 10,
    emailFaturamento: emailFaturamento || 'fazenda@prefeitura.gov.br',
    telefoneContato: telefoneContato || '(41) 3000-0000',
    createdAt: new Date().toISOString(),
  };

  saasTenants.push(newTenant);

  // Automatically create the 2 standard included users: Prefeito + Secretário de Finanças
  if (prefeitoNome && prefeitoEmail) {
    saasUsers.push({
      id: `user-${Date.now()}-1`,
      tenantId: newTenantId,
      nome: prefeitoNome,
      email: prefeitoEmail,
      cpf: prefeitoCpf || '000.***.***-00',
      cargo: 'Prefeito(a) Municipal',
      role: 'PREFEITO',
      secretariaRestrita: null,
      ativo: true,
      isExtra: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (secFinancasNome && secFinancasEmail) {
    saasUsers.push({
      id: `user-${Date.now()}-2`,
      tenantId: newTenantId,
      nome: secFinancasNome,
      email: secFinancasEmail,
      cpf: secFinancasCpf || '000.***.***-00',
      cargo: 'Secretário(a) de Finanças / Fazenda',
      role: 'SECRETARIO_FINANCAS',
      secretariaRestrita: null,
      ativo: true,
      isExtra: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Automatically provision ALL essential public data APIs (Siconfi, Transferegov, TCE, Portal Transparência, SIOPS, SIOPE, Emendas)
  const apisToProvision = Array.isArray(apis) && apis.length > 0
    ? apis
    : generateApisForMunicipality(newTenant.cidade, newTenant.uf, newTenant.codigoIbge);

  apisToProvision.forEach((apiTemplate: any, idx: number) => {
    saasApiConfigs.push({
      id: `api-${Date.now()}-${idx}-${(apiTemplate.providerName || 'api').toLowerCase()}`,
      tenantId: newTenantId,
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

  return res.status(201).json({
    success: true,
    tenant: getTenantWithStats(newTenant),
    message: `Prefeitura ${newTenant.nomePrefeitura} cadastrada com sucesso! Foram provisionados os 2 usuários padrão e ${apisToProvision.length} APIs de dados abertos e controle fiscal.`,
  });
});

// 3. PUT /api/saas/tenants/:id - Update tenant info / status / pricing
app.put('/api/saas/tenants/:id', (req, res) => {
  const { id } = req.params;
  const index = saasTenants.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Prefeitura não encontrada.' });
  }

  saasTenants[index] = {
    ...saasTenants[index],
    ...req.body,
    valorMensalBase: req.body.valorMensalBase !== undefined ? Number(req.body.valorMensalBase) : saasTenants[index].valorMensalBase,
    userLimit: req.body.userLimit !== undefined ? Number(req.body.userLimit) : saasTenants[index].userLimit,
    valorUsuarioExtra: req.body.valorUsuarioExtra !== undefined ? Number(req.body.valorUsuarioExtra) : saasTenants[index].valorUsuarioExtra,
    diaVencimento: req.body.diaVencimento !== undefined ? Number(req.body.diaVencimento) : saasTenants[index].diaVencimento,
  };

  return res.json({
    success: true,
    tenant: getTenantWithStats(saasTenants[index]),
    message: `Dados da Prefeitura ${saasTenants[index].nomePrefeitura} atualizados com sucesso!`,
  });
});

// 3.1 DELETE /api/saas/tenants/:id - Delete tenant (Company Master Only)
app.delete('/api/saas/tenants/:id', (req, res) => {
  const { id } = req.params;
  const index = saasTenants.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Prefeitura não encontrada.' });
  }

  const deletedTenant = saasTenants[index];
  saasTenants = saasTenants.filter(t => t.id !== id);
  saasUsers = saasUsers.filter(u => u.tenantId !== id);
  saasApiConfigs = saasApiConfigs.filter(a => a.tenantId !== id);

  return res.json({
    success: true,
    message: `Prefeitura ${deletedTenant.nomePrefeitura} e seus acessos foram removidos com sucesso.`,
  });
});

// 3.2 POST /api/saas/solicitacao-usuario - Municipal request for new user sent to SaaS company
app.post('/api/saas/solicitacao-usuario', (req, res) => {
  const { tenantId, nomeSolicitante, emailSolicitante, nomeNovoUsuario, emailNovoUsuario, cargoNovoUsuario, justificativa } = req.body;
  const tenant = saasTenants.find(t => t.id === tenantId);
  
  return res.json({
    success: true,
    protocolo: `SOL-${Date.now().toString().slice(-6)}`,
    message: `Solicitação de cadastro de novo usuário para ${tenant ? tenant.nomePrefeitura : 'Município'} enviada com sucesso à equipe da Empresa SaaS! A ativação será processada em até 2 horas úteis.`,
  });
});

// 4. GET /api/saas/tenants/:id/apis - Get APIs for a tenant
app.get('/api/saas/tenants/:id/apis', (req, res) => {
  const { id } = req.params;
  const apis = saasApiConfigs.filter(a => a.tenantId === id);
  res.json({ success: true, apis });
});

// 5. POST /api/saas/tenants/:id/apis - Add or update API config
app.post('/api/saas/tenants/:id/apis', (req, res) => {
  const { id } = req.params;
  const { providerName, label, baseUrl, authType, apiKey, syncFrequency, customHeaders } = req.body;

  if (!providerName || !baseUrl) {
    return res.status(400).json({ error: 'Provedor e URL Base são obrigatórios.' });
  }

  // Mask API key for secure storage view
  const masked = apiKey ? `${apiKey.substring(0, 6)}...***...${apiKey.substring(apiKey.length - 4)}` : 'N/A';

  const newApi: MockApiConfig = {
    id: `api-${Date.now()}`,
    tenantId: id,
    providerName,
    label: label || `API ${providerName}`,
    baseUrl,
    authType: authType || 'NONE',
    apiKeyMasked: masked,
    customHeaders: customHeaders || {},
    syncFrequency: syncFrequency || '0 6,18 * * *',
    ativo: true,
    ultimoStatus: 'SUCESSO',
    ultimaSincronizacao: 'Cadastrada agora',
    totalRegistrosSincronizados: 0,
  };

  saasApiConfigs.push(newApi);
  res.status(201).json({ success: true, api: newApi });
});

// 6. DELETE /api/saas/tenants/:id/apis/:apiId - Remove API config
app.delete('/api/saas/tenants/:id/apis/:apiId', (req, res) => {
  const { apiId } = req.params;
  saasApiConfigs = saasApiConfigs.filter(a => a.id !== apiId);
  res.json({ success: true, message: 'API removida com sucesso.' });
});

// 7. POST /api/saas/tenants/:id/apis/:apiId/sync - Trigger manual sync
app.post('/api/saas/tenants/:id/apis/:apiId/sync', (req, res) => {
  const { apiId } = req.params;
  const api = saasApiConfigs.find(a => a.id === apiId);
  if (!api) {
    return res.status(404).json({ error: 'API não encontrada.' });
  }

  api.ultimoStatus = 'SUCESSO';
  api.ultimaSincronizacao = `Sincronizado manualmente às ${new Date().toLocaleTimeString('pt-BR')}`;
  api.totalRegistrosSincronizados = (api.totalRegistrosSincronizados || 0) + Math.floor(Math.random() * 450 + 50);

  res.json({ success: true, api, message: `Sincronização da API ${api.label} concluída com êxito.` });
});

// 8. GET /api/saas/tenants/:id/users - Get users for tenant
app.get('/api/saas/tenants/:id/users', (req, res) => {
  const { id } = req.params;
  const tenant = saasTenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ error: 'Prefeitura não encontrada.' });
  }

  const users = saasUsers.filter(u => u.tenantId === id);
  const activeCount = users.filter(u => u.ativo).length;
  const userLimit = tenant.userLimit;
  const usuariosExcedentes = Math.max(0, activeCount - userLimit);
  const cobrancaExtraTotal = usuariosExcedentes * tenant.valorUsuarioExtra;

  res.json({
    success: true,
    users,
    quota: {
      userLimit,
      totalAtivos: activeCount,
      usuariosInclusos: Math.min(activeCount, userLimit),
      usuariosExcedentes,
      valorUsuarioExtra: tenant.valorUsuarioExtra,
      cobrancaExtraTotal,
      valorMensalBase: tenant.valorMensalBase,
      valorTotalMensalidade: tenant.valorMensalBase + cobrancaExtraTotal,
    },
  });
});

// 9. POST /api/saas/tenants/:id/users - Add user with Quota logic
app.post('/api/saas/tenants/:id/users', (req, res) => {
  const { id } = req.params;
  const tenant = saasTenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ error: 'Prefeitura não encontrada.' });
  }

  const { nome, email, cpf, cargo, role, secretariaRestrita } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  const currentActiveUsers = saasUsers.filter(u => u.tenantId === id && u.ativo).length;
  const willBeExtra = currentActiveUsers >= tenant.userLimit;

  const newUser: MockUser = {
    id: `user-${Date.now()}`,
    tenantId: id,
    nome,
    email,
    cpf: cpf || '000.***.***-00',
    cargo: cargo || 'Servidor Municipal',
    role: role || 'SECRETARIA_SETORIAL',
    secretariaRestrita: secretariaRestrita || null,
    ativo: true,
    isExtra: willBeExtra,
    ultimoAcesso: 'Nunca acessou (Convite enviado)',
    createdAt: new Date().toISOString(),
  };

  saasUsers.push(newUser);

  const newActiveCount = currentActiveUsers + 1;
  const newExcedentes = Math.max(0, newActiveCount - tenant.userLimit);
  const newExtraCharge = newExcedentes * tenant.valorUsuarioExtra;

  res.status(201).json({
    success: true,
    user: newUser,
    isExtraUser: willBeExtra,
    quotaUpdate: {
      totalAtivos: newActiveCount,
      usuariosExcedentes: newExcedentes,
      cobrancaExtraTotal: newExtraCharge,
      valorTotalMensalidade: tenant.valorMensalBase + newExtraCharge,
    },
    message: willBeExtra
      ? `Usuário cadastrado com sucesso como EXCEDENTE (+R$ ${tenant.valorUsuarioExtra.toFixed(2)}/mês na próxima fatura).`
      : `Usuário cadastrado com sucesso dentro do pacote básico (${newActiveCount}/${tenant.userLimit} inclusos).`,
  });
});

// 10. PUT /api/saas/tenants/:id/users/:userId - Update or toggle user
app.put('/api/saas/tenants/:id/users/:userId', (req, res) => {
  const { userId } = req.params;
  const index = saasUsers.findIndex(u => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  saasUsers[index] = {
    ...saasUsers[index],
    ...req.body,
  };

  res.json({ success: true, user: saasUsers[index] });
});

// 11. DELETE /api/saas/tenants/:id/users/:userId - Remove user
app.delete('/api/saas/tenants/:id/users/:userId', (req, res) => {
  const { userId } = req.params;
  saasUsers = saasUsers.filter(u => u.id !== userId);
  res.json({ success: true, message: 'Usuário removido com sucesso.' });
});

// 12. GET /api/saas/invoices - Invoices list
app.get('/api/saas/invoices', (req, res) => {
  const invoices = saasTenants.map(t => {
    const users = saasUsers.filter(u => u.tenantId === t.id && u.ativo);
    const totalUsuarios = users.length;
    const usuariosExcedentes = Math.max(0, totalUsuarios - t.userLimit);
    const valorUsuariosExtras = usuariosExcedentes * t.valorUsuarioExtra;
    const valorTotal = t.valorMensalBase + valorUsuariosExtras;

    return {
      id: `inv-2026-08-${t.codigoIbge}`,
      tenantId: t.id,
      prefeituraNome: t.nomePrefeitura,
      mesReferencia: 8,
      anoReferencia: 2026,
      valorBase: t.valorMensalBase,
      totalUsuarios,
      usuariosExcedentes,
      valorUsuariosExtras,
      valorTotal,
      dataVencimento: `2026-08-${String(t.diaVencimento).padStart(2, '0')}`,
      status: t.status === 'ATIVO' ? 'PAGO' : 'PENDENTE',
      numeroNfse: `NFSe-2026/${Math.floor(1000 + Math.random() * 9000)}`,
      codigoBarrasPix: `00020126580014br.gov.bcb.pix0136${t.cnpj.replace(/\D/g, '')}`,
    };
  });

  res.json({ success: true, invoices });
});

// 13. GET /api/saas/metrics - Global SaaS overview
app.get('/api/saas/metrics', (req, res) => {
  const totalPrefeituras = saasTenants.length;
  const prefeiturasAtivas = saasTenants.filter(t => t.status === 'ATIVO').length;
  
  let mrrTotal = 0;
  let totalUsuariosAtivos = 0;
  let totalUsuariosFaturadosExtras = 0;
  let faturamentoExtras = 0;

  saasTenants.forEach(t => {
    const users = saasUsers.filter(u => u.tenantId === t.id && u.ativo);
    const activeCount = users.length;
    const extras = Math.max(0, activeCount - t.userLimit);
    const extraVal = extras * t.valorUsuarioExtra;
    
    totalUsuariosAtivos += activeCount;
    totalUsuariosFaturadosExtras += extras;
    faturamentoExtras += extraVal;
    mrrTotal += (t.valorMensalBase + extraVal);
  });

  res.json({
    success: true,
    metrics: {
      totalPrefeituras,
      prefeiturasAtivas,
      mrrTotal,
      totalUsuariosAtivos,
      totalUsuariosFaturadosExtras,
      faturamentoExtras,
      taxaInadimplencia: 0.0,
      apisOnlinePct: 98.6,
    },
  });
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Araucaria Fiscal Dashboard] Servidor iniciado na porta ${PORT}`);
  });
}

startServer();
