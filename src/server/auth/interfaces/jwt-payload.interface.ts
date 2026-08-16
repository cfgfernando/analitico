export type UserRole =
  | 'MASTER_ADMIN'
  | 'PREFEITO'
  | 'SECRETARIO_FINANCAS'
  | 'CONTROLADORIA'
  | 'SECRETARIA_SETORIAL'
  | 'VISUALIZADOR_GERAL'
  | 'CUSTOMIZADO';

/** Permissões granulares disponíveis no sistema */
export type Permission =
  | 'fiscal:read'
  | 'fiscal:write'
  | 'fiscal:export'
  | 'siconfi:read'
  | 'siconfi:sync'
  | 'tenants:manage'
  | 'users:manage'
  | 'billing:read'
  | 'billing:write'
  | 'audit:read'
  | 'alertas:manage';

/** Mapa de permissões padrão por role (RBAC baseado em papel) */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  MASTER_ADMIN: [
    'fiscal:read', 'fiscal:write', 'fiscal:export',
    'siconfi:read', 'siconfi:sync',
    'tenants:manage', 'users:manage',
    'billing:read', 'billing:write',
    'audit:read', 'alertas:manage',
  ],
  PREFEITO: [
    'fiscal:read', 'fiscal:export',
    'siconfi:read',
    'billing:read',
    'audit:read',
    'alertas:manage',
  ],
  SECRETARIO_FINANCAS: [
    'fiscal:read', 'fiscal:write', 'fiscal:export',
    'siconfi:read', 'siconfi:sync',
    'audit:read', 'alertas:manage',
  ],
  CONTROLADORIA: [
    'fiscal:read', 'fiscal:export',
    'siconfi:read',
    'audit:read',
  ],
  SECRETARIA_SETORIAL: [
    'fiscal:read',
    'siconfi:read',
  ],
  VISUALIZADOR_GERAL: [
    'fiscal:read',
  ],
  CUSTOMIZADO: [],
};

export interface JwtPayload {
  sub: string;       // userId
  userId: string;
  email: string;
  nomeCompleto: string;
  tenantId: string;
  role: UserRole;
  permissions?: Permission[];
  secretaria?: string | null;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nomeCompleto: string;
  tenantId: string;
  role: UserRole;
  permissions: Permission[];
  secretaria?: string | null;
  sessionId?: string;
}
