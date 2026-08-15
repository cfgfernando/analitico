import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Scale,
  HandCoins,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Presentation,
  Maximize2,
  Minimize2,
  MapPin,
  Landmark,
  Check,
  ShieldCheck,
  Moon,
  Sun,
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
  novasEmendas7Dias = 0,
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

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

  const tabs = [
    {
      id: 'modulo1',
      number: '01',
      label: 'DASHBOARD PRINCIPAL',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Visão executiva, KPIs consolidados e semáforos fiscais',
    },
    {
      id: 'modulo2',
      number: '02',
      label: 'RECEITAS ORÇAMENTÁRIAS',
      shortLabel: 'Receitas',
      icon: TrendingUp,
      desc: 'Arrecadação, ICMS/REPAR, ISSQN, IPTU e reestimativa LOA',
    },
    {
      id: 'modulo3',
      number: '03',
      label: 'DESPESAS E FUNÇÕES',
      shortLabel: 'Despesas',
      icon: Receipt,
      desc: 'Execução por função de governo e natureza de despesa',
    },
    {
      id: 'modulo4',
      number: '04',
      label: 'LIMITES LRF',
      shortLabel: 'Limites LRF',
      icon: Scale,
      badge: 'Alerta 50,15%',
      badgeColor: 'amber',
      desc: 'Folha de pessoal, pisos constitucionais e endividamento',
    },
    {
      id: 'modulo5',
      number: '05',
      label: 'CAPTAÇÃO E CONVÊNIOS',
      shortLabel: 'Captação',
      icon: HandCoins,
      badge: novasEmendas7Dias > 0 ? `+${novasEmendas7Dias} novas (7d)` : undefined,
      badgeColor: 'emerald',
      desc: 'Emendas parlamentares federais/estaduais e Transferegov',
    },
    {
      id: 'modulo6',
      number: '06',
      label: 'FUNDEB',
      shortLabel: 'FUNDEB',
      icon: GraduationCap,
      desc: 'Magistério, complementação VAAT/VAAR e matrizes SIOPE',
    },
    {
      id: 'siconfi',
      number: '07',
      label: 'API SICONFI LIVE',
      shortLabel: 'Siconfi API',
      icon: Database,
      badge: authRole === 'PREFEITURA_CLIENTE' ? 'Consulta Segura' : 'Configuração',
      badgeColor: 'emerald',
      desc: 'Console de dados abertos e payloads JSON do Tesouro Nacional',
    },
    {
      id: 'diagnostico',
      number: '08',
      label: 'DIAGNÓSTICO EXECUTIVO',
      shortLabel: 'IA Auditor',
      icon: Sparkles,
      desc: 'Parecer técnico automatizado e consultoria estratégica',
    },
    {
      id: 'obras',
      number: '09',
      label: 'MAPA DE OBRAS',
      shortLabel: 'Mapa Obras',
      icon: MapPin,
      badge: 'Georreferenciado',
      badgeColor: 'emerald',
      desc: 'Obras públicas em execução, geolocalização e avanço físico',
    },
    {
      id: 'saas_admin',
      number: '10',
      label: 'PAINEL MASTER SAAS',
      shortLabel: authRole === 'PREFEITURA_CLIENTE' ? 'Master SaaS 🔒' : 'Master SaaS',
      icon: Building2,
      badge: authRole === 'PREFEITURA_CLIENTE' ? '🔒 Exclusivo Empresa' : 'Provedor SaaS',
      badgeColor: authRole === 'PREFEITURA_CLIENTE' ? 'amber' : 'emerald',
      desc: 'Gestão multi-tenant de prefeituras, edição cadastral, APIs dinâmicas e faturamento',
    },
    {
      id: 'usuarios',
      number: '11',
      label: 'GESTÃO DE USUÁRIOS',
      shortLabel: authRole === 'PREFEITURA_CLIENTE' ? 'Equipe Municipal' : 'Usuários & Licenças',
      icon: Layers,
      badge: authRole === 'PREFEITURA_CLIENTE' ? '2 Inclusos' : 'Controle SaaS',
      badgeColor: 'amber',
      desc: authRole === 'PREFEITURA_CLIENTE'
        ? 'Visualização de acessos municipais e solicitações à Empresa Mantenedora'
        : 'Cadastro e acréscimos de usuários para prefeituras contratantes',
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    // Scroll window smoothly to top of main view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div
      className="sticky top-0"
      style={{ zIndex: 'var(--sgf-z-header)', boxShadow: 'var(--sgf-shadow-md)' }}
    >
      {/* Top Header - Deep Slate with Emerald Accent Line */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b-4 border-emerald-500">
        {/* Brand & Municipal Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            title="Menu de navegação dos módulos"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('modulo1')}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left focus:outline-none group"
            title="Ir para o Dashboard Principal"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-lg sm:text-xl text-slate-950 shadow-sm shrink-0 font-mono select-none group-hover:bg-emerald-400 transition">
              {tenantInfo.cidade ? tenantInfo.cidade.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold leading-tight uppercase tracking-wider text-white">
                  SGF {tenantInfo.cidade || 'Araucária'}
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {tenantInfo.uf || 'PR'}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate max-w-[180px] sm:max-w-none">
                Gestão Fiscal & Orçamentária
              </p>
            </div>
          </button>

          {/* Role / Profile Selector (Empresa Master vs Prefeitura Cliente) */}
          <div className="relative ml-1 sm:ml-3" ref={roleDropdownRef}>
            <button
              type="button"
              id="btn-switch-user-role"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold border transition shadow-sm cursor-pointer select-none ${
                authRole === 'EMPRESA_MASTER'
                  ? 'bg-blue-950/90 hover:bg-blue-900 text-blue-200 border-blue-500/50 hover:border-blue-400'
                  : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-500/50 hover:border-emerald-400'
              }`}
              title="Clique para alternar entre Perfil Empresa SaaS (Master) e Prefeitura Municipal (Cliente)"
            >
              {authRole === 'EMPRESA_MASTER' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="hidden sm:inline font-mono">🏢 Empresa Master</span>
                  <span className="sm:hidden font-mono">🏢 Master</span>
                </>
              ) : (
                <>
                  <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline font-mono">🏛️ {tenantInfo.cidade || 'Prefeitura'}</span>
                  <span className="sm:hidden font-mono">🏛️ Cliente</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
              >
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800 font-bold flex items-center justify-between">
                  <span>Alternar Perfil de Acesso</span>
                  <span className="text-amber-400">Controle RBAC</span>
                </div>

                <div className="space-y-1.5 mt-2">
                  <button
                    type="button"
                    id="btn-role-empresa-master"
                    onClick={() => handleSelectRole('EMPRESA_MASTER')}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      authRole === 'EMPRESA_MASTER'
                        ? 'bg-blue-600/30 text-white border border-blue-500 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      🏢
                    </div>
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between text-blue-200">
                        <span>Empresa SaaS (Master Admin)</span>
                        {authRole === 'EMPRESA_MASTER' && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1">
                        Acesso total: cadastrar prefeituras, gerenciar planos, faturamento, criar usuários e configurar APIs.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="btn-role-prefeitura-cliente"
                    onClick={() => handleSelectRole('PREFEITURA_CLIENTE')}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      authRole === 'PREFEITURA_CLIENTE'
                        ? 'bg-emerald-600/30 text-white border border-emerald-500 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      🏛️
                    </div>
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between text-emerald-200">
                        <span>Prefeitura Municipal (Cliente)</span>
                        {authRole === 'PREFEITURA_CLIENTE' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1">
                        Acesso cliente: Módulos fiscais (01 ao 09) e visualização de servidores cadastrados pela empresa.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Year Selector, Refresh, Export, Siconfi Pill */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* IBGE Metric (Desktop) */}
          <div className="hidden xl:flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CÓDIGO IBGE</span>
            <span className="text-xs font-mono text-slate-200 font-semibold">{tenantInfo.codigoIbge || '4101804'}</span>
          </div>

          <div className="hidden xl:block h-8 w-[1px] bg-white/20"></div>

          {/* Exercise Year Selector */}
          <div className="flex items-center sm:flex-col sm:items-end gap-1 sm:gap-0">
            <span className="hidden sm:inline text-[9px] uppercase font-bold text-slate-400 tracking-wider">EXERCÍCIO</span>
            <div className="flex items-center gap-1">
              {[2024, 2025, 2026].map(ano => (
                <button
                  type="button"
                  key={ano}
                  id={`btn-ano-${ano}`}
                  onClick={() => onSelectAno(ano)}
                  className={`px-1.5 sm:px-2 py-0.5 text-xs font-mono font-bold rounded-sm transition-all ${
                    anoSelecionado === ano
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={`Alternar para o exercício de ${ano}`}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/20 hidden sm:block"></div>

          {/* Actions: Refresh, Export & Modo Apresentação */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onTogglePresentationMode && (
              <button
                type="button"
                id="header-presentation-mode-btn"
                onClick={onTogglePresentationMode}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm text-xs font-bold font-mono uppercase tracking-wider transition shadow-sm cursor-pointer ${
                  isPresentationMode
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title={
                  isPresentationMode
                    ? 'Sair do Modo Apresentação (Esc)'
                    : 'Ativar Modo Apresentação (Tela cheia para TCE-PR / Audiência)'
                }
              >
                <Presentation className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isPresentationMode ? 'Sair da Apresentação' : 'Apresentação TCE'}
                </span>
              </button>
            )}

            <button
              type="button"
              id="header-refresh-btn"
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Atualizar dados oficiais do Tesouro Nacional / Siconfi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button
                type="button"
                id="header-dark-mode-toggle-btn"
                onClick={onToggleDarkMode}
                className="p-1.5 sm:p-2 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition relative overflow-hidden"
                title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                <span className="relative block w-3.5 h-3.5">
                  <Sun
                    className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-300 ${
                      isDarkMode ? 'opacity-100 rotate-0 scale-100 text-amber-400' : 'opacity-0 -rotate-90 scale-50'
                    }`}
                  />
                  <Moon
                    className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-300 ${
                      isDarkMode ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100 text-slate-300'
                    }`}
                  />
                </span>
              </button>
            )}

            <button
              type="button"
              id="header-export-csv-btn"
              onClick={onExportAllCSV}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition"
              title="Exportar dados consolidados em planilha CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Bar with Scroll Arrows */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative flex items-center">
        {/* Left Scroll Arrow for Narrow Screens */}
        <button
          type="button"
          onClick={() => scrollNav('left')}
          className="hidden md:flex items-center justify-center w-7 h-11 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-r border-slate-200 dark:border-slate-800 z-10 shrink-0"
          title="Rolar menu para esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Horizontal Navigation List */}
        <nav
          ref={navScrollRef}
          id="main-desktop-navigation"
          className="h-11 flex-1 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth"
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const isCaptacaoComNovas = tab.id === 'modulo5' && novasEmendas7Dias > 0;
            return (
              <button
                type="button"
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`text-xs uppercase tracking-wider py-2.5 px-2.5 sm:px-3 font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 rounded-sm ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-600 dark:border-emerald-400 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border-b-2 border-transparent font-semibold'
                }`}
                title={tab.desc}
              >
                <div className="relative inline-flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  {isCaptacaoComNovas && (
                    <span
                      id="badge-icon-captacao-desktop"
                      className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5"
                      title={`${novasEmendas7Dias} novas emendas processadas nos últimos 7 dias`}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                    </span>
                  )}
                </div>
                <span>{tab.number}. {tab.label}</span>
                {tab.badge && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-sm ml-1 ${
                      tab.badgeColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                    }`}
                    title={tab.badge}
                  >
                    {tab.badgeColor === 'emerald' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    )}
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => scrollNav('right')}
          className="hidden md:flex items-center justify-center w-7 h-11 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-l border-slate-200 dark:border-slate-800 z-10 shrink-0"
          title="Rolar menu para direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Live Siconfi Status Pill (Desktop right) */}
        <div className="hidden xl:flex items-center gap-2 shrink-0 px-4 border-l border-slate-200 dark:border-slate-800">
          <div
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-sm border flex items-center gap-1.5 ${
              siconfiStatus?.online
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
            title={`API Tesouro Nacional Siconfi: ${siconfiStatus?.online ? 'Conectado' : 'Cache local ativo'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                siconfiStatus?.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>SICONFI: {siconfiStatus?.online ? 'SINCRONIZADO' : 'CACHE'}</span>
            {siconfiStatus?.latencyMs !== undefined && (
              <span className="opacity-60 font-mono">({siconfiStatus.latencyMs}ms)</span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Current Module Quick Bar (Visible only on smaller screens) */}
      <div className="lg:hidden bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">MÓDULO ATIVO:</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
            <span className="relative inline-flex items-center justify-center">
              {React.createElement(currentTabObj.icon, { className: 'w-3.5 h-3.5' })}
              {currentTabObj.id === 'modulo5' && novasEmendas7Dias > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </span>
            <span>{currentTabObj.number}. {currentTabObj.label}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-emerald-500"
        >
          <span>Todos Módulos</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden bg-slate-900 border-b border-slate-800 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto"
        >
          <div className="p-4 space-y-3">
            {/* Mobile Profile Switcher Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>Perfil de Acesso Atual:</span>
                <span className="text-amber-400 font-bold">RBAC</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="mobile-btn-role-master"
                  onClick={() => handleSelectRole('EMPRESA_MASTER')}
                  className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    authRole === 'EMPRESA_MASTER'
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-[11px] leading-tight text-center">🏢 Empresa SaaS</span>
                  {authRole === 'EMPRESA_MASTER' && (
                    <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-mono">ATIVO</span>
                  )}
                </button>

                <button
                  type="button"
                  id="mobile-btn-role-cliente"
                  onClick={() => handleSelectRole('PREFEITURA_CLIENTE')}
                  className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    authRole === 'PREFEITURA_CLIENTE'
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] leading-tight text-center">🏛️ {tenantInfo.cidade || 'Prefeitura'}</span>
                  {authRole === 'PREFEITURA_CLIENTE' && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">ATIVO</span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider px-1 flex items-center justify-between">
              <span>Selecione um Módulo para Acessar:</span>
              <span className="text-emerald-400">{tabs.length} MÓDULOS</span>
            </div>

            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isCaptacaoComNovas = tab.id === 'modulo5' && novasEmendas7Dias > 0;
              return (
                <button
                  type="button"
                  key={tab.id}
                  id={`mobile-tab-btn-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full text-left p-3 rounded-sm transition flex items-start gap-3 border ${
                    isActive
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-inner'
                      : 'bg-slate-800/70 border-slate-700/80 text-slate-200 hover:bg-slate-700/80 hover:border-emerald-500/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 mt-0.5 relative ${
                      isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {isCaptacaoComNovas && (
                      <span
                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-emerald-400 text-[9px] font-mono font-black text-slate-950 ring-2 ring-slate-900 shadow-sm"
                        title={`${novasEmendas7Dias} novas emendas parlamentares processadas nos últimos 7 dias`}
                      >
                        {novasEmendas7Dias}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono tracking-wider uppercase text-white">
                        {tab.number}. {tab.label}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-mono font-bold uppercase bg-emerald-500 text-slate-950">
                          ATIVO
                        </span>
                      )}
                      {tab.badge && !isActive && (
                        <span
                          className={`px-1.5 py-0.2 rounded-sm text-[9px] font-mono font-bold uppercase ${
                            tab.badgeColor === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>Siconfi Tesouro: {siconfiStatus?.online ? 'Online' : 'Cache'}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-emerald-400 hover:underline font-bold text-xs"
              >
                Fechar Menu ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


