import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  FileSpreadsheet,
  Menu,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Presentation,
  Moon,
  Sun,
  MapPin,
  Check,
  ShieldCheck,
  Landmark,
  Search,
  LogOut,
  Sparkles,
  Building,
} from 'lucide-react';
import { SiconfiApiStatus } from '../types/fiscal';
import { useAuthContext } from '../contexts/AuthContext';
import { TenantBrandingConfig } from '../types/saas';

interface HeaderProps {
  anoSelecionado: number;
  onSelectAno: (ano: number) => void;
  siconfiStatus: SiconfiApiStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onExportAllCSV: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  novasEmendas7Dias?: number;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  tenantInfo?: {
    id?: string;
    nomePrefeitura: string;
    cidade: string;
    uf: string;
    codigoIbge: string;
    cnpj?: string;
    status?: string;
    branding?: TenantBrandingConfig;
  };
  authRole?: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE';
  onChangeAuthRole?: (role: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE') => void;
  onToggleSidebar?: () => void;
  onSelectTenant?: (tenant: any) => void;
  onLogout?: () => void;
}

const PREFEITURAS_RAPIDAS = [
  { id: 'tenant-araucaria', codigoIbge: '4101804', cidade: 'Araucária', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Araucária', porte: 'Grande Porte (Polo Industrial)' },
  { id: 'tenant-contenda', codigoIbge: '4106209', cidade: 'Contenda', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Contenda', porte: 'Médio Porte (Região Metropolitana)' },
  { id: 'tenant-curitiba', codigoIbge: '4106902', cidade: 'Curitiba', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Curitiba', porte: 'Capital / Metrópole' },
  { id: 'tenant-maringa', codigoIbge: '4115200', cidade: 'Maringá', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Maringá', porte: 'Grande Porte (Norte/Noroeste)' },
  { id: 'tenant-londrina', codigoIbge: '4113700', cidade: 'Londrina', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Londrina', porte: 'Grande Porte (Norte)' },
  { id: 'tenant-pontagrossa', codigoIbge: '4119905', cidade: 'Ponta Grossa', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Ponta Grossa', porte: 'Grande Porte (Campos Gerais)' },
  { id: 'tenant-cascavel', codigoIbge: '4104808', cidade: 'Cascavel', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Cascavel', porte: 'Grande Porte (Oeste)' },
  { id: 'tenant-saojosedospinhais', codigoIbge: '4125506', cidade: 'São José dos Pinhais', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de São José dos Pinhais', porte: 'Grande Porte (Metropolitana)' },
  { id: 'tenant-fozdoiguacu', codigoIbge: '4108304', cidade: 'Foz do Iguaçu', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Foz do Iguaçu', porte: 'Grande Porte (Fronteira)' },
  { id: 'tenant-colombo', codigoIbge: '4105805', cidade: 'Colombo', uf: 'PR', nomePrefeitura: 'Prefeitura Municipal de Colombo', porte: 'Grande Porte (Metropolitana)' },
];

export const Header: React.FC<HeaderProps> = ({
  anoSelecionado,
  onSelectAno,
  siconfiStatus,
  loading,
  onRefresh,
  onExportAllCSV,
  activeTab,
  setActiveTab,
  isPresentationMode = false,
  onTogglePresentationMode,
  isDarkMode = false,
  onToggleDarkMode,
  tenantInfo = {
    id: 'tenant-araucaria',
    nomePrefeitura: 'Prefeitura Municipal de Araucária',
    cidade: 'Araucária',
    uf: 'PR',
    codigoIbge: '4101804',
  },
  authRole = 'EMPRESA_MASTER',
  onChangeAuthRole,
  onToggleSidebar,
  onSelectTenant,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    if (roleDropdownOpen || cityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen, cityDropdownOpen]);

  const handleSelectRole = (newRole: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE') => {
    if (onChangeAuthRole) {
      onChangeAuthRole(newRole);
    }
    setRoleDropdownOpen(false);
  };

  const getTabLabel = (id: string) => {
    switch (id) {
      case 'painel_prefeito': return 'Painel do Prefeito (Gabinete)';
      case 'painel_gestao': return 'Saúde Financeira Municipal — Contratos & Contingenciamento';
      case 'benchmark': return 'Benchmark Regional de Municípios';
      case 'selo': return 'Selo de Conformidade Fiscal';
      case 'alertas_prazos': return 'Radar de Alertas & Prazos Críticos';
      case 'modulo1': return '01. Dashboard Executivo & KPIs';
      case 'modulo2': return '02. Receitas & Reforma Tributária (EC 132)';
      case 'modulo3': return '03. Despesas & Funções de Governo';
      case 'modulo4': return '04. Limites LRF & Gastos com Pessoal';
      case 'modulo5': return '05. Captação Externa & Convênios';
      case 'modulo6': return '06. FUNDEB, VAAT/VAAR & SIOPE';
      case 'diagnostico': return '08. Diagnóstico IA Auditor';
      case 'obras': return '09. Mapa de Obras Georreferenciado';
      case 'siconfi': return '10. Console API SICONFI Live';
      case 'saas_admin': return 'Painel Master SaaS (Empresa)';
      case 'tenant_users': return 'Gestão de Usuários e Acessos';
      default: return 'Painel de Indicadores';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-navy-950 border-b border-navy-800 text-white shadow-md">
      {/* Container Principal: Desktop e Tablet */}
      <div className="w-full px-3 sm:px-4 lg:px-6 flex items-center justify-between h-13 sm:h-14 gap-2">
        {/* Esquerda: Botão Menu + Brasão e Nome do Município */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-sm bg-navy-900 hover:bg-navy-800 text-white border border-navy-700 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Abrir / Fechar Menu Lateral ([)"
            aria-label="Alternar Menu Lateral"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Seletor de Município: Interativo para EMPRESA_MASTER, Fixo/Isolado para PREFEITURA_CLIENTE */}
          <div className="relative min-w-0" ref={cityDropdownRef}>
            {authRole === 'EMPRESA_MASTER' ? (
              <button
                onClick={() => setCityDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 text-left p-1 rounded-sm hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
                title="Clique para alternar de Prefeitura / Município (Modo Master)"
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center shrink-0 font-bold overflow-hidden"
                  style={{
                    backgroundColor: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                      ? `${tenantInfo.branding.customPrimaryColor}33`
                      : 'rgba(16, 185, 129, 0.2)',
                    borderColor: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                      ? `${tenantInfo.branding.customPrimaryColor}88`
                      : 'rgba(16, 185, 129, 0.4)',
                    borderWidth: '1px',
                  }}
                >
                  {tenantInfo.branding?.customLogoUrl ? (
                    <img src={tenantInfo.branding.customLogoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                  ) : (
                    <Landmark className="w-4 h-4 text-emerald-300" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-[13px] font-mono tracking-tight text-white uppercase truncate flex items-center gap-1">
                      {tenantInfo.cidade} <span className="text-slate-400 font-normal sm:inline">({tenantInfo.uf})</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <span className="hidden md:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-slate-800 text-slate-200 border border-slate-700">
                      IBGE {tenantInfo.codigoIbge}
                    </span>
                    {tenantInfo.branding?.isCustomized ? (
                      <span className="hidden lg:inline-block text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                        ★ White-Label
                      </span>
                    ) : (
                      <span className="hidden lg:inline-block text-[9px] font-mono text-slate-400">
                        by Escrita.Online
                      </span>
                    )}
                  </div>
                  <span
                    className="hidden sm:inline-block text-xs font-mono font-bold truncate"
                    style={{
                      color: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                        ? tenantInfo.branding.customPrimaryColor
                        : '#34d399',
                    }}
                  >
                    {tenantInfo.branding?.customPortalTitle || getTabLabel(activeTab)}
                  </span>
                </div>
              </button>
            ) : (
              /* Usuário Municipal: visual fixo e seguro, sem acesso a outras prefeituras */
              <div className="flex items-center gap-2 text-left p-1 select-none">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center shrink-0 font-bold overflow-hidden"
                  style={{
                    backgroundColor: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                      ? `${tenantInfo.branding.customPrimaryColor}33`
                      : 'rgba(16, 185, 129, 0.2)',
                    borderColor: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                      ? `${tenantInfo.branding.customPrimaryColor}88`
                      : 'rgba(16, 185, 129, 0.4)',
                    borderWidth: '1px',
                  }}
                >
                  {tenantInfo.branding?.customLogoUrl ? (
                    <img src={tenantInfo.branding.customLogoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                  ) : (
                    <Landmark className="w-4 h-4 text-emerald-300" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-[13px] font-mono tracking-tight text-white uppercase truncate">
                      {tenantInfo.cidade} <span className="text-slate-400 font-normal sm:inline">({tenantInfo.uf})</span>
                    </span>
                    <span className="hidden md:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-slate-800 text-slate-200 border border-slate-700">
                      IBGE {tenantInfo.codigoIbge}
                    </span>
                    {tenantInfo.branding?.isCustomized ? (
                      <span className="hidden lg:inline-block text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                        ★ White-Label
                      </span>
                    ) : (
                      <span className="hidden lg:inline-block text-[9px] font-mono text-slate-400">
                        by Escrita.Online
                      </span>
                    )}
                  </div>
                  <span
                    className="hidden sm:inline-block text-xs font-mono font-bold truncate"
                    style={{
                      color: tenantInfo.branding?.isCustomized && tenantInfo.branding.customPrimaryColor
                        ? tenantInfo.branding.customPrimaryColor
                        : '#34d399',
                    }}
                  >
                    {tenantInfo.branding?.customPortalTitle || getTabLabel(activeTab)}
                  </span>
                </div>
              </div>
            )}

            {/* Dropdown de Alternância de Prefeitura: APENAS PARA EMPRESA_MASTER */}
            {authRole === 'EMPRESA_MASTER' && cityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-navy-900 border border-navy-700 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="p-2.5 bg-navy-950 border-b border-navy-800">
                  <div className="flex items-center gap-1.5 bg-navy-900 border border-navy-700 rounded-xs px-2 py-1">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar prefeitura ou código IBGE..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-navy-800/60">
                  {PREFEITURAS_RAPIDAS
                    .filter(p =>
                      p.cidade.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
                      p.codigoIbge.includes(citySearchTerm) ||
                      p.nomePrefeitura.toLowerCase().includes(citySearchTerm.toLowerCase())
                    )
                    .map((pref) => (
                      <button
                        key={pref.id}
                        onClick={() => {
                          if (onSelectTenant) {
                            onSelectTenant(pref);
                          }
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-navy-800/80 transition flex items-center justify-between gap-2 cursor-pointer ${
                          tenantInfo.codigoIbge === pref.codigoIbge ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold text-white font-mono uppercase">
                              {pref.cidade} ({pref.uf})
                            </strong>
                            <span className="text-[9px] font-mono text-slate-400">
                              IBGE {pref.codigoIbge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {pref.porte}
                          </span>
                        </div>

                        {tenantInfo.codigoIbge === pref.codigoIbge && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                </div>

                <div className="p-2 bg-navy-950/80 border-t border-navy-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Multi-Tenant SGF 2026</span>
                  <span className="text-emerald-400">Sincronização Ativa</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Controles e Ações Adaptados para Telas Pequenas */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Seletor de Exercício Fiscal */}
          <div className="flex items-center bg-navy-950 border border-navy-700 rounded-sm p-0.5 shadow-inner">
            {[2024, 2025, 2026, 2027].map(ano => (
              <button
                key={ano}
                onClick={() => onSelectAno(ano)}
                className={`px-1.5 sm:px-2 py-0.5 text-xs font-mono font-bold rounded-xs transition cursor-pointer ${
                  anoSelecionado === ano
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-navy-800'
                }`}
                title={`Alternar para o exercício de ${ano}`}
              >
                {ano}
              </button>
            ))}
          </div>

          {/* Status SICONFI / Sincronização */}
          {siconfiStatus && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-mono border ${
                siconfiStatus.conectado
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
              }`}
              title={siconfiStatus.mensagem || 'Status da API Siconfi'}
            >
              {siconfiStatus.conectado ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate max-w-[120px] lg:max-w-none text-[11px] font-bold">
                {siconfiStatus.conectado ? 'SICONFI CONECTADO' : 'SICONFI OFFLINE'}
              </span>
            </div>
          )}

          {/* Botão Sincronizar */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded-sm bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700 transition cursor-pointer disabled:opacity-50"
            title="Sincronizar dados fiscais e orçamentários"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sincronizar</span>
          </button>

          {/* Botão Exportar CSV */}
          <button
            onClick={onExportAllCSV}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-sm bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700 transition cursor-pointer"
            title="Exportar Relatório Geral Consolidado em Planilha CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          {/* Modo Apresentação */}
          {onTogglePresentationMode && (
            <button
              onClick={onTogglePresentationMode}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-sm text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                isPresentationMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-navy-900 hover:bg-navy-800 text-slate-200 border-navy-700'
              }`}
              title="Alternar Modo Apresentação para Reuniões e Audiências"
            >
              <Presentation className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">{isPresentationMode ? 'Sair' : 'Apresentação'}</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-sm bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-700 transition cursor-pointer"
              title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar Tema Claro/Escuro"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
          )}

          {/* Seletor de Papel / Perfil do Usuário */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-navy-900 hover:bg-navy-800 border border-navy-700 text-white text-xs font-mono transition cursor-pointer"
              title="Perfil de Acesso do Usuário"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="hidden md:inline font-bold">
                {authRole === 'EMPRESA_MASTER' ? 'Master SaaS' : 'Prefeitura'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-navy-900 border border-navy-700 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="p-2.5 bg-navy-950 border-b border-navy-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Conta Conectada</span>
                  <span className="font-bold text-white font-mono truncate block">
                    {authRole === 'EMPRESA_MASTER' ? 'admin@escrita.online' : `fiscal@${tenantInfo.cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.pr.gov.br`}
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => handleSelectRole('EMPRESA_MASTER')}
                    className={`w-full text-left p-2 rounded-xs text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                      authRole === 'EMPRESA_MASTER'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold block">Administrador Master</span>
                        <span className="text-[10px] text-slate-400 block">Gestão multi-tenant global</span>
                      </div>
                    </div>
                    {authRole === 'EMPRESA_MASTER' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => handleSelectRole('PREFEITURA_CLIENTE')}
                    className={`w-full text-left p-2 rounded-xs text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                      authRole === 'PREFEITURA_CLIENTE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="font-bold block">Gestor Municipal</span>
                        <span className="text-[10px] text-slate-400 block">{tenantInfo.cidade} / {tenantInfo.uf}</span>
                      </div>
                    </div>
                    {authRole === 'PREFEITURA_CLIENTE' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>

                {onLogout && (
                  <div className="p-1 border-t border-navy-800 bg-navy-950/60">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left p-2 rounded-xs text-xs text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition flex items-center gap-2 font-mono cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subheader Mobile (Visível apenas em telas < 640px para exibir o módulo ativo de forma elegante) */}
      <div className="sm:hidden px-3 py-1 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
        <span className="text-emerald-400 font-bold truncate">
          {getTabLabel(activeTab)}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SICONFI LIVE</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
