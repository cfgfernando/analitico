import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AuthRole = 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: AuthRole;
  tenantId?: string;
}

interface AuthContextType {
  authRole: AuthRole;
  setAuthRole: (role: AuthRole) => void;
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authRole, setAuthRoleState] = useState<AuthRole>(() => {
    try {
      const saved = localStorage.getItem('sgf_auth_role');
      if (saved === 'PREFEITURA_CLIENTE' || saved === 'EMPRESA_MASTER') return saved;
    } catch {}
    return 'EMPRESA_MASTER';
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => ({
    id: 'user-ara-1',
    nome: 'Dr. Hissam Hussein Dehaini',
    email: 'gabinete.prefeito@araucaria.pr.gov.br',
    role: authRole,
  }));

  const setAuthRole = (newRole: AuthRole) => {
    setAuthRoleState(newRole);
    try {
      localStorage.setItem('sgf_auth_role', newRole);
    } catch {}
  };

  const logout = () => {
    try {
      localStorage.removeItem('sgf_access_token');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        authRole,
        setAuthRole,
        currentUser,
        setCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  return ctx;
};
