import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TenantInfoState {
  id: string;
  nomePrefeitura: string;
  cidade: string;
  uf: string;
  codigoIbge: string;
}

interface TenantContextType {
  activeTenant: TenantInfoState;
  setActiveTenant: (tenant: TenantInfoState) => void;
}

const defaultTenant: TenantInfoState = {
  id: 'tenant-araucaria',
  nomePrefeitura: 'Prefeitura Municipal de Araucária',
  cidade: 'Araucária',
  uf: 'PR',
  codigoIbge: '4101804',
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTenant, setActiveTenantState] = useState<TenantInfoState>(() => {
    try {
      const saved = localStorage.getItem('sgf_active_tenant');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultTenant;
  });

  const setActiveTenant = (tenant: TenantInfoState) => {
    setActiveTenantState(tenant);
    try {
      localStorage.setItem('sgf_active_tenant', JSON.stringify(tenant));
      localStorage.setItem('sgf_active_tenant_id', tenant.id);
    } catch {}
  };

  return (
    <TenantContext.Provider value={{ activeTenant, setActiveTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext deve ser usado dentro de um TenantProvider');
  return ctx;
};
