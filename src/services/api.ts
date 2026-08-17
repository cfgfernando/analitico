import {
  FiscalKPIs,
  RevenueSource,
  ExpenseNature,
  ExpenseFunction,
  LRFLimit,
  FiscalAlert,
  EmendaParlamentar,
  ConvenioRecurso,
  FundebData,
  SiconfiApiStatus,
  ObraAraucaria,
  ObrasSummary,
} from '../types/fiscal';
import {
  TenantSummary,
  SaaSUser,
  TenantApiConfig,
  SaaSInvoice,
  SaaSSummaryMetrics,
  AutoDiscoveredMunicipality,
} from '../types/saas';

// ==========================================
// UNIFIED AUTHENTICATED FETCH HELPER
// ==========================================
function getAuthHeaders(customHeaders?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const token = localStorage.getItem('sgf_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantId = localStorage.getItem('sgf_active_tenant_id');
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }
  } catch {}

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, val]) => {
        headers[key] = val;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return headers;
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = getAuthHeaders(init?.headers);
  return fetch(input, {
    ...init,
    headers,
  });
}

// ==========================================
// FISCAL ENGINE API SERVICES
// ==========================================

export async function getSiconfiStatus(tenantId?: string): Promise<SiconfiApiStatus> {
  const url = tenantId ? `/api/siconfi/status?tenantId=${encodeURIComponent(tenantId)}` : '/api/siconfi/status';
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Falha ao verificar status da API Siconfi');
  return res.json();
}

export async function getFiscalSummary(ano: number = 2026, tenantId?: string): Promise<FiscalKPIs> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (tenantId) params.append('tenantId', tenantId);
  const res = await authFetch(`/api/fiscal/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar resumo fiscal');
  return res.json();
}

export async function getReceitas(ano: number = 2026, tenantId?: string): Promise<{ ano: number; receitas: RevenueSource[] }> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (tenantId) params.append('tenantId', tenantId);
  const res = await authFetch(`/api/fiscal/receitas?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar receitas');
  return res.json();
}

export async function getDespesas(ano: number = 2026, tenantId?: string): Promise<{
  ano: number;
  porNatureza: ExpenseNature[];
  porFuncao: ExpenseFunction[];
}> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (tenantId) params.append('tenantId', tenantId);
  const res = await authFetch(`/api/fiscal/despesas?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar despesas');
  return res.json();
}

export async function getLimitesLRF(ano: number = 2026, tenantId?: string): Promise<{ ano: number; limites: LRFLimit[] }> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (tenantId) params.append('tenantId', tenantId);
  const res = await authFetch(`/api/fiscal/lrf?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar limites LRF');
  return res.json();
}

export async function getCaptacaoRecursos(tenantId?: string): Promise<{
  metaAnual: number;
  captadoAcumulado: number;
  percentualAtingimento: string;
  novasEmendas7Dias?: number;
  emendas: EmendaParlamentar[];
  convenios: ConvenioRecurso[];
}> {
  const url = tenantId ? `/api/fiscal/captacao?tenantId=${encodeURIComponent(tenantId)}` : '/api/fiscal/captacao';
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Falha ao carregar dados de captação');
  return res.json();
}

export async function getFundebData(tenantId?: string): Promise<FundebData> {
  const url = tenantId ? `/api/fiscal/fundeb?tenantId=${encodeURIComponent(tenantId)}` : '/api/fiscal/fundeb';
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Falha ao carregar dados do FUNDEB');
  return res.json();
}

export async function getFiscalAlerts(tenantId?: string): Promise<FiscalAlert[]> {
  const url = tenantId ? `/api/fiscal/alertas?tenantId=${encodeURIComponent(tenantId)}` : '/api/fiscal/alertas';
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Falha ao carregar alertas fiscais');
  return res.json();
}

export async function querySiconfiProxy(endpoint: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({ endpoint, ...params });
  const res = await authFetch(`/api/siconfi/proxy?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar Siconfi');
  return res.json();
}

export async function getAIDiagnosis(question?: string, contextData?: any, tenantId?: string, ano?: number): Promise<{
  success: boolean;
  analise: string;
  diagnostico?: string;
  provedor: string;
  timestamp: string;
}> {
  const res = await authFetch('/api/fiscal/diagnostico-ia', {
    method: 'POST',
    body: JSON.stringify({ question, prompt: question, contextData, summary: contextData, tenantId, ano }),
  });
  if (!res.ok) throw new Error('Falha ao obter diagnóstico fiscal');
  return res.json();
}

export async function getAnalisePreditiva(ano: number, ultimos6Meses: any[], tenantId?: string): Promise<{
  success: boolean;
  analise: string;
  provedor: string;
  timestamp: string;
  ano: number;
}> {
  const res = await authFetch('/api/fiscal/analise-preditiva', {
    method: 'POST',
    body: JSON.stringify({ ano, ultimos6Meses, tenantId }),
  });
  if (!res.ok) throw new Error('Falha ao obter análise preditiva de IA');
  return res.json();
}

export async function getObrasAraucaria(tenantId?: string): Promise<{
  obras: ObraAraucaria[];
  summary: ObrasSummary;
}> {
  const url = tenantId ? `/api/fiscal/obras?tenantId=${encodeURIComponent(tenantId)}` : '/api/fiscal/obras';
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Falha ao carregar dados de obras');
  return res.json();
}

// ==========================================
// SAAS MULTI-TENANT & USER CLIENT SERVICES
// ==========================================

export async function searchMunicipiosLookup(query: string): Promise<{ success: boolean; municipality: AutoDiscoveredMunicipality; message: string }> {
  const res = await authFetch(`/api/saas/municipios/lookup?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nenhum município localizado com o termo informado.');
  }
  return res.json();
}

export async function getMunicipiosSuggestions(q: string): Promise<{ success: boolean; suggestions: { codigoIbge: string; cidade: string; uf: string; cnpj: string; nomePrefeitura: string }[] }> {
  const res = await authFetch(`/api/saas/municipios/suggestions?q=${encodeURIComponent(q)}`);
  if (!res.ok) return { success: false, suggestions: [] };
  return res.json();
}

export async function getSaaSTenants(): Promise<{ success: boolean; tenants: TenantSummary[] }> {
  const res = await authFetch('/api/saas/tenants');
  if (!res.ok) throw new Error('Falha ao carregar lista de prefeituras clientes');
  return res.json();
}

export async function createSaaSTenant(data: any): Promise<{ success: boolean; tenant: TenantSummary; message: string }> {
  const res = await authFetch('/api/saas/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cadastrar prefeitura');
  }
  return res.json();
}

export async function updateSaaSTenant(id: string, data: any): Promise<{ success: boolean; tenant: TenantSummary; message?: string }> {
  const res = await authFetch(`/api/saas/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar prefeitura');
  }
  return res.json();
}

export async function deleteSaaSTenant(id: string): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`/api/saas/tenants/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao remover prefeitura');
  }
  return res.json();
}

export async function sendSolicitacaoUsuario(data: {
  tenantId: string;
  nomeSolicitante: string;
  emailSolicitante: string;
  nomeNovoUsuario: string;
  emailNovoUsuario: string;
  cargoNovoUsuario: string;
  justificativa?: string;
}): Promise<{ success: boolean; protocolo: string; message: string }> {
  const res = await authFetch('/api/saas/solicitacao-usuario', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao enviar solicitação');
  return res.json();
}

export async function getTenantApis(tenantId: string): Promise<{ success: boolean; apis: TenantApiConfig[] }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/apis`);
  if (!res.ok) throw new Error('Falha ao carregar APIs da prefeitura');
  return res.json();
}

export async function createTenantApi(tenantId: string, data: any): Promise<{ success: boolean; api: TenantApiConfig }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/apis`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cadastrar API');
  }
  return res.json();
}

export async function deleteTenantApi(tenantId: string, apiId: string): Promise<{ success: boolean }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/apis/${apiId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir API');
  return res.json();
}

export async function triggerTenantApiSync(tenantId: string, apiId: string): Promise<{ success: boolean; api: TenantApiConfig; message: string }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/apis/${apiId}/sync`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao sincronizar API');
  return res.json();
}

export async function getTenantUsers(tenantId: string): Promise<{
  success: boolean;
  users: SaaSUser[];
  quota: {
    userLimit: number;
    totalAtivos: number;
    usuariosInclusos: number;
    usuariosExcedentes: number;
    valorUsuarioExtra: number;
    cobrancaExtraTotal: number;
    valorMensalBase: number;
    valorTotalMensalidade: number;
  };
}> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/users`);
  if (!res.ok) throw new Error('Falha ao carregar usuários da prefeitura');
  return res.json();
}

export async function createTenantUser(tenantId: string, data: any): Promise<{
  success: boolean;
  user: SaaSUser;
  isExtraUser: boolean;
  message: string;
}> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cadastrar usuário');
  }
  return res.json();
}

export async function updateTenantUser(tenantId: string, userId: string, data: any): Promise<{ success: boolean; user: SaaSUser }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar usuário');
  return res.json();
}

export async function deleteTenantUser(tenantId: string, userId: string): Promise<{ success: boolean }> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/users/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir usuário');
  return res.json();
}

export async function getSaaSInvoices(): Promise<{ success: boolean; invoices: SaaSInvoice[] }> {
  const res = await authFetch('/api/saas/invoices');
  if (!res.ok) throw new Error('Falha ao carregar faturas do SaaS');
  return res.json();
}

export async function getSaaSMetrics(): Promise<{ success: boolean; metrics: SaaSSummaryMetrics }> {
  const res = await authFetch('/api/saas/metrics');
  if (!res.ok) throw new Error('Falha ao carregar métricas consolidadas do SaaS');
  return res.json();
}

// ==========================================
// AUTHENTICATION & WHITE-LABEL API SERVICES
// ==========================================

export async function lookupUserTenant(identifier: string): Promise<{
  found: boolean;
  message?: string;
  user?: {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    cargo: string;
    role: string;
    secretariaRestrita?: string | null;
  };
  tenant?: {
    id: string;
    codigoIbge: string;
    nomePrefeitura: string;
    cidade: string;
    uf: string;
    cnpj: string;
    status: string;
    branding?: any;
  };
}> {
  const res = await fetch('/api/auth/lookup-identifier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao consultar identificador');
  }
  return res.json();
}

export async function loginTenantUser(identifier: string, senha: string): Promise<{
  success: boolean;
  token: string;
  user: any;
  tenant: any;
  message: string;
}> {
  const res = await fetch('/api/auth/login-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, senha }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciais inválidas ou prefeitura não encontrada.');
  }
  return res.json();
}

export async function loginAdminMaster(email: string, senha: string): Promise<{
  success: boolean;
  token: string;
  user: any;
  message: string;
}> {
  const res = await fetch('/api/auth/login-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciais de administrador master inválidas.');
  }
  return res.json();
}

export async function updateTenantBranding(tenantId: string, brandingData: any): Promise<{
  success: boolean;
  branding: any;
  tenant: any;
  message: string;
}> {
  const res = await authFetch(`/api/saas/tenants/${tenantId}/branding`, {
    method: 'PUT',
    body: JSON.stringify(brandingData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar personalização da prefeitura.');
  }
  return res.json();
}
