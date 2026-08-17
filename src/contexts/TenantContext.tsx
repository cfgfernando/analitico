import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TenantBrandingConfig } from '../types/saas';

export interface TenantInfoState {
  id: string;
  nomePrefeitura: string;
  cidade: string;
  uf: string;
  codigoIbge: string;
  cnpj?: string;
  status?: string;
  branding?: TenantBrandingConfig;
}

interface TenantContextType {
  activeTenant: TenantInfoState;
  setActiveTenant: (tenant: TenantInfoState) => void;
  updateActiveTenantBranding: (branding: TenantBrandingConfig) => void;
}

const defaultTenant: TenantInfoState = {
  id: 'tenant-araucaria',
  nomePrefeitura: 'Prefeitura Municipal de Araucária',
  cidade: 'Araucária',
  uf: 'PR',
  codigoIbge: '4101804',
  cnpj: '76.105.535/0001-99',
  status: 'ATIVO',
  branding: {
    isCustomized: false,
    showSaaSBranding: true,
    customPortalTitle: 'Sistema de Monitoramento Fiscal Municipal',
    customSubtitle: 'Prefeitura Municipal de Araucária — Estado do Paraná',
    customPrimaryColor: '#10b981',
    customSecondaryColor: '#059669',
    taxaImplantacao: 0.00,
    mensalidadeCustomizacao: 0.00,
  },
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

  const updateActiveTenantBranding = (branding: TenantBrandingConfig) => {
    setActiveTenantState(prev => {
      const updated = { ...prev, branding };
      try {
        localStorage.setItem('sgf_active_tenant', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <TenantContext.Provider value={{ activeTenant, setActiveTenant, updateActiveTenantBranding }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext deve ser usado dentro de um TenantProvider');
  return ctx;
};

