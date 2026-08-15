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
}

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
    nomePrefeitura: 'Prefeitura Municipal de Araucária',
    cidade: 'Araucária',
    uf: 'PR',
    codigoIbge: '4101804',
  },
  authRole = 'EMPRESA_MASTER',
  onChangeAuthRole,
  onToggleSidebar,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen]);

  const handleSelectRole = (newRole: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE') => {
    if (onChangeAuthRole) {
      onChangeAuthRole(newRole);
    }
    setRoleDropdownOpen(false);
  };

  const getTabLabel = (id: string) => {
    switch (id) {
      case 'painel_prefeito': return 'Painel do Prefeito (Gabinete)';
      case 'benchmark': return 'Benchmark Regional & Eficiência Fiscal';
      case 'selo': return 'Selo de Conformidade & Certificado Oficial';
      case 'alertas_prazos': return 'Radar de Alertas & Prazos Críticos';
      case 'modulo1': return '01. Dashboard Executivo & KPIs';
      case 'modulo2': return '02. Receitas Orçamentárias & Reforma EC 132';
      case 'modulo3': return '03. Despesas & Funções de Governo';
      case 'modulo4': return '04. Limites LRF & Gastos de Pessoal';
      case 'modulo5': return '05. Captação Externa & Convênios';
      case 'modulo6': return '06. FUNDEB, VAAT/VAAR & SIOPE';
      case 'diagnostico': return '08. Diagnóstico IA Auditor';
      case 'obras': return '09. Mapa Georreferenciado de Obras';
      case 'siconfi': return '10. Console API SICONFI Live';
      case 'saas_admin': return 'Painel Master SaaS (Empresa)';
      case 'tenant_users': return 'Gestão de Usuários e Acessos';
      default: return 'Painel Fiscal';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="w-full px-3 sm:px-4 lg:px-6 flex items-center justify-between h-14 gap-2">
        {/* Left: Sidebar Toggle + Tenant Info & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
            title="Abrir/Fechar Menu Lateral ([)"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-sm bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs font-mono tracking-tight text-white uppercase truncate">
                  {tenantInfo.cidade} / {tenantInfo.uf}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-slate-800 text-slate-400 border border-slate-700">
                  IBGE {tenantInfo.codigoIbge}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 truncate">
                {getTabLabel(activeTab)}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Seletor de Exercício Fiscal */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5">
            {[2024, 2025, 2026, 2027].map(ano => (
              <button
                key={ano}
                onClick={() => onSelectAno(ano)}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-xs transition cursor-pointer ${
                  anoSelecionado === ano
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>

          {/* SICONFI Live Status */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300"
            title={`API SICONFI Live: ${siconfiStatus?.tempoRespostaMs || 240}ms`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>SICONFI LIVE</span>
            <span className="text-[10px] text-slate-400 font-bold">
              {siconfiStatus?.tempoRespostaMs || 240}ms
            </span>
          </div>

          {/* Botão de Atualizar Dados */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Atualizar Dados Fiscais"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Botão Exportar CSV */}
          <button
            onClick={onExportAllCSV}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-sm hover:bg-emerald-900/50 transition cursor-pointer"
            title="Exportar Relatório Consolidado em CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Botão Modo Apresentação */}
          {onTogglePresentationMode && (
            <button
              onClick={onTogglePresentationMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer border ${
                isPresentationMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Alternar Modo Apresentação para Audiências Públicas"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apresentação</span>
            </button>
          )}

          {/* Toggle Tema Escuro/Claro */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>
          )}

          {/* Dropdown de Seleção de Papel (Role) */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-bold">
                {authRole === 'EMPRESA_MASTER' ? 'Empresa Master' : 'Prefeitura'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-sm shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                  Alternar Perfil de Acesso
                </div>

                <button
                  onClick={() => handleSelectRole('EMPRESA_MASTER')}
                  className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-slate-800 transition ${
                    authRole === 'EMPRESA_MASTER' ? 'text-emerald-400 font-bold bg-slate-800/40' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🏢 Empresa SaaS (Master)</span>
                  </div>
                  {authRole === 'EMPRESA_MASTER' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleSelectRole('PREFEITURA_CLIENTE')}
                  className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-slate-800 transition ${
                    authRole === 'PREFEITURA_CLIENTE' ? 'text-amber-400 font-bold bg-slate-800/40' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>🏛️ Prefeitura Cliente</span>
                  </div>
                  {authRole === 'PREFEITURA_CLIENTE' && <Check className="w-3 h-3 text-amber-400" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
