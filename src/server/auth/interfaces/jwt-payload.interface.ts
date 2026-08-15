export type UserRole =
  | 'MASTER_ADMIN'
  | 'PREFEITO'
  | 'SECRETARIO_FINANCAS'
  | 'CONTROLADORIA'
  | 'SECRETARIA_SETORIAL'
  | 'VISUALIZADOR_GERAL'
  | 'CUSTOMIZADO';

export interface JwtPayload {
  sub: string; // userId
  userId: string;
  email: string;
  nomeCompleto: string;
  tenantId: string;
  role: UserRole;
  secretaria?: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nomeCompleto: string;
  tenantId: string;
  role: UserRole;
  secretaria?: string | null;
}
