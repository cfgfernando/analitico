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
} from 'lucide-react';
import { SiconfiApiStatus } from '../types/fiscal';

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
  };
  authRole?: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE';
  onChangeAuthRole?: (role: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE') => void;
  onToggleSidebar?: () => void;
  onSelectTenant?: (tenant: any) => void;
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
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Container Principal: Desktop e Tablet */}
      <div className="w-full px-3 sm:px-4 lg:px-6 flex items-center justify-between h-13 sm:h-14 gap-2">
        {/* Esquerda: Botão Menu + Brasão e Nome do Município */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Abrir / Fechar Menu Lateral ([)"
            aria-label="Alternar Menu Lateral"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Seletor de Município com Dropdown Interativo */}
          <div className="relative min-w-0" ref={cityDropdownRef}>
            <button
              onClick={() => setCityDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 text-left p-1 rounded-sm hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
              title="Clique para alternar de Prefeitura / Município"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 font-bold">
                <Landmark className="w-4 h-4" />
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
                </div>
                <span className="hidden sm:inline-block text-xs font-mono font-bold text-emerald-400 truncate">
                  {getTabLabel(activeTab)}
                </span>
              </div>
            </button>

            {/* Dropdown de Alternância de Prefeitura */}
            {cityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="p-2.5 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xs px-2 py-1">
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

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
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
                        className={`w-full text-left p-2.5 hover:bg-slate-800/80 transition flex items-center justify-between gap-2 cursor-pointer ${
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

                <div className="p-2 bg-slate-950/80 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
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
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-sm p-0.5 shadow-inner">
            {[2024, 2025, 2026, 2027].map(ano => (
              <button
                key={ano}
                onClick={() => onSelectAno(ano)}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-mono font-bold rounded-xs transition cursor-pointer ${
                  anoSelecionado === ano
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>

          {/* SICONFI Live Status (Oculto em telas mobile estreitas para não quebrar) */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
            title={`API SICONFI Live: ${siconfiStatus?.latenciaMs || 240}ms`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold">SICONFI LIVE</span>
            <span className="text-[11px] text-emerald-400 font-bold">
              {siconfiStatus?.latenciaMs || 240}ms
            </span>
          </div>

          {/* Botão de Atualizar Dados */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition cursor-pointer disabled:opacity-50 active:scale-95"
            title="Atualizar Dados Fiscais"
            aria-label="Atualizar Dados"
          >
            <RefreshCw className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Botão Exportar CSV */}
          <button
            onClick={onExportAllCSV}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-700 rounded-sm hover:bg-emerald-900/80 transition cursor-pointer shadow-xs"
            title="Exportar Relatório Consolidado em CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Botão Modo Apresentação */}
          {onTogglePresentationMode && (
            <button
              onClick={onTogglePresentationMode}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer border shadow-xs ${
                isPresentationMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
              }`}
              title="Alternar Modo Apresentação para Audiências Públicas"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Apresentação</span>
            </button>
          )}

          {/* Toggle Tema Escuro/Claro */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition cursor-pointer active:scale-95"
              title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              aria-label="Alternar Tema"
            >
              {isDarkMode ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-200" />}
            </button>
          )}

          {/* Dropdown de Seleção de Papel (Role) */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(prev => !prev)}
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-100 transition cursor-pointer shadow-xs active:scale-95"
              title="Alternar Perfil de Acesso"
            >
              <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400 shrink-0" />
              <span className="hidden md:inline font-bold">
                {authRole === 'EMPRESA_MASTER' ? 'Empresa Master' : 'Prefeitura'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 sm:w-60 bg-slate-900 border border-slate-700 rounded-sm shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] sm:text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Alternar Perfil de Acesso
                </div>

                <button
                  onClick={() => handleSelectRole('EMPRESA_MASTER')}
                  className={`w-full text-left px-3 py-2 text-xs font-mono font-medium flex items-center justify-between hover:bg-slate-800 transition cursor-pointer ${
                    authRole === 'EMPRESA_MASTER' ? 'text-emerald-300 font-bold bg-slate-800/60' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>🏢 Empresa SaaS (Master)</span>
                  </div>
                  {authRole === 'EMPRESA_MASTER' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleSelectRole('PREFEITURA_CLIENTE')}
                  className={`w-full text-left px-3 py-2 text-xs font-mono font-medium flex items-center justify-between hover:bg-slate-800 transition cursor-pointer ${
                    authRole === 'PREFEITURA_CLIENTE' ? 'text-amber-300 font-bold bg-slate-800/60' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>🏛️ Prefeitura Cliente</span>
                  </div>
                  {authRole === 'PREFEITURA_CLIENTE' && <Check className="w-4 h-4 text-amber-400" />}
                </button>
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
