/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { Module1KPIs } from './components/Module1KPIs';
import { Module2Receitas } from './components/Module2Receitas';
import { Module3Despesas } from './components/Module3Despesas';
import { Module4LRF } from './components/Module4LRF';
import { Module5Captacao } from './components/Module5Captacao';
import { Module6Fundeb } from './components/Module6Fundeb';
import { ModuleSiconfiExplorer } from './components/ModuleSiconfiExplorer';
import { ModuleAIDiagnostico } from './components/ModuleAIDiagnostico';
import { ModuleObrasMap } from './components/ModuleObrasMap';
import { SaaSAdminPanel } from './components/SaaSAdminPanel';
import { TenantUserManagement } from './components/TenantUserManagement';
import {
  getSiconfiStatus,
  getFiscalSummary,
  getReceitas,
  getDespesas,
  getLimitesLRF,
  getCaptacaoRecursos,
  getFundebData,
  getFiscalAlerts,
  getObrasAraucaria,
} from './services/api';
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
  ComparativeAnalysis,
  ComparativeMode,
  MonthlyComparativeAnalysis,
  QuarterlyComparativeAnalysis,
  ObraAraucaria,
  ObrasSummary,
} from './types/fiscal';
import { exportToCSV, isEmendaRecente } from './utils/formatters';
import { buildComparativeAnalysis, buildMonthlyComparativeAnalysis, buildQuarterlyComparativeAnalysis } from './utils/comparative';
import { ToastContainer } from './components/Toast';
import { ToastMessage } from './types/fiscal';
import {
  RefreshCw,
  AlertCircle,
  Building,
  Building2,
  Presentation,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const PRESENTATION_TABS = [
  { id: 'modulo1', num: '01', title: 'Dashboard Executivo & KPIs', badge: 'Semáforos Fiscais' },
  { id: 'modulo2', num: '02', title: 'Receitas Orçamentárias', badge: 'Arrecadação & LOA' },
  { id: 'modulo3', num: '03', title: 'Despesas e Funções de Governo', badge: 'Saúde, Educação, Obras' },
  { id: 'modulo4', num: '04', title: 'Limites LRF & Contas do TCE-PR', badge: 'Folha 50,15% e Pisos' },
  { id: 'modulo5', num: '05', title: 'Captação Externa & Transferegov', badge: 'Emendas & Convênios' },
  { id: 'modulo6', num: '06', title: 'FUNDEB, VAAT/VAAR & SIOPE', badge: 'Magistério 74,2%' },
  { id: 'siconfi', num: '07', title: 'API Siconfi Live (Tesouro Nacional)', badge: 'Dados Abertos' },
  { id: 'diagnostico', num: '08', title: 'Diagnóstico IA Especialista', badge: 'Parecer Técnico' },
  { id: 'obras', num: '09', title: 'Mapa Georreferenciado de Obras', badge: 'Infraestrutura' },
];

export default function App() {
  const [ano, setAno] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<string>('modulo1');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tenant state for SaaS Multi-Tenant
  const [activeTenant, setActiveTenant] = useState<{
    id: string;
    nomePrefeitura: string;
    cidade: string;
    uf: string;
    codigoIbge: string;
  }>({
    id: 'tenant-araucaria',
    nomePrefeitura: 'Prefeitura Municipal de Araucária',
    cidade: 'Araucária',
    uf: 'PR',
    codigoIbge: '4101804',
  });

  // Authentication & RBAC role state (SaaS Master vs Prefeitura Cliente)
  const [authRole, setAuthRole] = useState<'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE'>(() => {
    try {
      const saved = localStorage.getItem('sgf_auth_role');
      if (saved === 'PREFEITURA_CLIENTE' || saved === 'EMPRESA_MASTER') {
        return saved;
      }
    } catch (e) {}
    return 'EMPRESA_MASTER';
  });

  // Presentation mode state
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast handlers
  const addToast = (toastData: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    try {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = {
        ...toastData,
        id,
        timestamp: Date.now(),
      };
      setToasts(prev => {
        const filtered = prev.filter(
          t => !(t.title === newToast.title && t.limitName === newToast.limitName && t.ano === newToast.ano)
        );
        return [newToast, ...filtered].slice(0, 4);
      });
    } catch (err) {
      console.warn('Toast error:', err);
    }
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleClearAllToasts = () => {
    setToasts([]);
  };

  const handleRoleChange = (newRole: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE') => {
    setAuthRole(newRole);
    try {
      localStorage.setItem('sgf_auth_role', newRole);
    } catch (e) {}

    addToast({
      type: newRole === 'EMPRESA_MASTER' ? 'info' : 'success',
      title: `Perfil Alternado: ${newRole === 'EMPRESA_MASTER' ? '🏢 Empresa SaaS (Master)' : `🏛️ ${activeTenant?.cidade || 'Prefeitura'} (Cliente)`}`,
      message: newRole === 'EMPRESA_MASTER'
        ? 'Acesso total ativado: Gerenciamento global de prefeituras, parametrização de APIs e credenciamento de usuários.'
        : `Acesso municipal ativado para ${activeTenant?.nomePrefeitura || 'Prefeitura Municipal'}. Módulos fiscais liberados em modo de governança.`,
    });
  };

  // Dark Mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgf_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {}
    return false;
  });

  // Apply/remove .dark class on <html> whenever isDarkMode changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('sgf_dark_mode', String(isDarkMode));
    } catch (e) {}
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Comparative analysis state
  const [comparativeMode, setComparativeMode] = useState<ComparativeMode>('nenhum');
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Agosto default
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1); // Q1 default
  const [isComparativoAnual, setIsComparativoAnual] = useState<boolean>(false);
  const [comparativeData, setComparativeData] = useState<ComparativeAnalysis | null>(null);

  // Data states
  const [siconfiStatus, setSiconfiStatus] = useState<SiconfiApiStatus | null>(null);
  const [summary, setSummary] = useState<FiscalKPIs | null>(null);
  const [receitas, setReceitas] = useState<RevenueSource[]>([]);
  const [porNatureza, setPorNatureza] = useState<ExpenseNature[]>([]);
  const [porFuncao, setPorFuncao] = useState<ExpenseFunction[]>([]);
  const [limites, setLimites] = useState<LRFLimit[]>([]);
  const [captacao, setCaptacao] = useState<{
    metaAnual: number;
    captadoAcumulado: number;
    percentualAtingimento: string;
    novasEmendas7Dias?: number;
    emendas: EmendaParlamentar[];
    convenios: ConvenioRecurso[];
  } | null>(null);
  const [fundeb, setFundeb] = useState<FundebData | null>(null);
  const [alerts, setAlerts] = useState<FiscalAlert[]>([]);
  const [obrasData, setObrasData] = useState<{
    obras: ObraAraucaria[];
    summary: ObrasSummary | null;
  }>({ obras: [], summary: null });

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('todos');
  const [selectedUnidade, setSelectedUnidade] = useState<string>('todas');
  const [mobileMoreOpen, setMobileMoreOpen] = useState<boolean>(false);

  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Synchronize browser fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard navigation during presentation mode (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape' && isPresentationMode) {
        setIsPresentationMode(false);
        return;
      }

      if (isPresentationMode) {
        const currentIndex = PRESENTATION_TABS.findIndex(t => t.id === activeTab);
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % PRESENTATION_TABS.length;
          handleTabChange(PRESENTATION_TABS[nextIndex].id);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + PRESENTATION_TABS.length) % PRESENTATION_TABS.length;
          handleTabChange(PRESENTATION_TABS[prevIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Inspect LRF limits and trigger proactive toast notifications
  const notifyLRFLimits = (limitesData: LRFLimit[], selectedYear: number) => {
    if (!limitesData || limitesData.length === 0) return;

    limitesData.forEach(limite => {
      const isMax = limite.limiteMinimoOuMaximo === 'maximo';
      const val = limite.percentualRealizado;

      if (isMax) {
        if (val >= limite.limiteLegal) {
          addToast({
            type: 'danger',
            title: 'LRF: Limite Legal Ultrapassado!',
            message: `${limite.nome} atingiu ${val.toFixed(2)}% da ${limite.baseCalculoNome} no exercício ${selectedYear}, ultrapassando o teto legal de ${limite.limiteLegal}%.`,
            limitName: limite.nome,
            metricValue: `${val.toFixed(2)}%`,
            threshold: `Teto Legal: ${limite.limiteLegal}%`,
            ano: selectedYear,
            actionLabel: 'Ver no Módulo 4: Limites LRF',
            actionTabId: 'modulo4',
            duration: 10000,
          });
        } else if (limite.limitePrudencial && val >= limite.limitePrudencial) {
          addToast({
            type: 'danger',
            title: 'LRF: Limite Prudencial Ultrapassado!',
            message: `${limite.nome} atingiu ${val.toFixed(2)}% da ${limite.baseCalculoNome} no exercício ${selectedYear}, ultrapassando o Limite Prudencial da LRF (${limite.limitePrudencial}%).`,
            limitName: limite.nome,
            metricValue: `${val.toFixed(2)}%`,
            threshold: `Prudencial: ${limite.limitePrudencial}% (Legal: ${limite.limiteLegal}%)`,
            ano: selectedYear,
            actionLabel: 'Ver no Módulo 4: Limites LRF',
            actionTabId: 'modulo4',
            duration: 9000,
          });
        }
      }
    });
  };

  const loadAllData = async (selectedYear: number = ano, tenantObj = activeTenant) => {
    setLoading(true);
    setError(null);

    try {
      const anoAnterior = selectedYear - 1;
      const tenantId = tenantObj?.id;
      const [
        statusRes,
        summaryRes,
        receitasRes,
        despesasRes,
        limitesRes,
        captacaoRes,
        fundebRes,
        alertsRes,
        prevSummaryRes,
        prevReceitasRes,
        prevDespesasRes,
        obrasRes,
      ] = await Promise.all([
        getSiconfiStatus(tenantId).catch(() => null),
        getFiscalSummary(selectedYear, tenantId).catch(err => {
          console.warn('getFiscalSummary error:', err);
          return null;
        }),
        getReceitas(selectedYear, tenantId).catch(err => {
          console.warn('getReceitas error:', err);
          return { ano: selectedYear, receitas: [] };
        }),
        getDespesas(selectedYear, tenantId).catch(err => {
          console.warn('getDespesas error:', err);
          return { ano: selectedYear, porNatureza: [], porFuncao: [] };
        }),
        getLimitesLRF(selectedYear, tenantId).catch(err => {
          console.warn('getLimitesLRF error:', err);
          return { ano: selectedYear, limites: [] };
        }),
        getCaptacaoRecursos(tenantId).catch(err => {
          console.warn('getCaptacaoRecursos error:', err);
          return null;
        }),
        getFundebData(tenantId).catch(err => {
          console.warn('getFundebData error:', err);
          return null;
        }),
        getFiscalAlerts(tenantId).catch(err => {
          console.warn('getFiscalAlerts error:', err);
          return [];
        }),
        getFiscalSummary(anoAnterior, tenantId).catch(() => null),
        getReceitas(anoAnterior, tenantId).catch(() => ({ ano: anoAnterior, receitas: [] })),
        getDespesas(anoAnterior, tenantId).catch(() => ({ ano: anoAnterior, porNatureza: [], porFuncao: [] })),
        getObrasAraucaria(tenantId).catch(() => ({ obras: [], summary: null })),
      ]);

      if (statusRes) setSiconfiStatus(statusRes);
      if (summaryRes) setSummary(summaryRes);
      if (receitasRes?.receitas) setReceitas(receitasRes.receitas);
      if (despesasRes?.porNatureza) setPorNatureza(despesasRes.porNatureza);
      if (despesasRes?.porFuncao) setPorFuncao(despesasRes.porFuncao);
      if (limitesRes?.limites) setLimites(limitesRes.limites);
      if (captacaoRes) setCaptacao(captacaoRes);
      if (fundebRes) setFundeb(fundebRes);
      if (alertsRes) setAlerts(alertsRes);
      if (obrasRes) setObrasData(obrasRes);

      // Build comparative analysis between selectedYear and selectedYear - 1
      if (summaryRes && receitasRes?.receitas && despesasRes?.porNatureza && despesasRes?.porFuncao) {
        const comp = buildComparativeAnalysis(
          selectedYear,
          summaryRes,
          prevSummaryRes,
          receitasRes.receitas,
          prevReceitasRes?.receitas || [],
          despesasRes.porNatureza,
          prevDespesasRes?.porNatureza || [],
          despesasRes.porFuncao,
          prevDespesasRes?.porFuncao || []
        );
        setComparativeData(comp);
      }

      // Check LRF limits and fire toast notifications if thresholds crossed
      if (limitesRes?.limites) {
        notifyLRFLimits(limitesRes.limites, selectedYear);
      }
    } catch (err: any) {
      console.error('Error fetching fiscal data:', err);
      setError(err.message || 'Erro ao carregar dados orçamentários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(ano, activeTenant);
  }, [ano, activeTenant]);

  // Monthly comparative data derived from current fiscal dataset and selected target month
  const monthlyComparativeData = useMemo<MonthlyComparativeAnalysis | null>(() => {
    if (receitas.length === 0) return null;
    return buildMonthlyComparativeAnalysis(ano, selectedMonth, receitas, porNatureza, porFuncao);
  }, [ano, selectedMonth, receitas, porNatureza, porFuncao]);

  // Quarterly comparative data derived from current fiscal dataset and selected quarter (Q1-Q4)
  const quarterlyComparativeData = useMemo<QuarterlyComparativeAnalysis | null>(() => {
    if (receitas.length === 0) return null;
    return buildQuarterlyComparativeAnalysis(ano, selectedQuarter, receitas, porNatureza, porFuncao);
  }, [ano, selectedQuarter, receitas, porNatureza, porFuncao]);

  const handleComparativeModeChange = (mode: ComparativeMode) => {
    setComparativeMode(mode);
    setIsComparativoAnual(mode === 'anual');
  };

  const handleToggleComparativoAnual = (enabled: boolean) => {
    setIsComparativoAnual(enabled);
    setComparativeMode(enabled ? 'anual' : 'nenhum');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPeriod('todos');
    setSelectedUnidade('todas');
    setComparativeMode('nenhum');
    setIsComparativoAnual(false);
    setSelectedMonth(8);
    setSelectedQuarter(1);
  };

  const handleExportConsolidatedCSV = () => {
    if (!summary) return;
    const generalData = [
      { Métrica: 'Município', Valor: 'Araucária / PR (IBGE 4101804)' },
      { Métrica: 'Exercício', Valor: ano },
      { Métrica: 'Receita Total Orçada (LOA)', Valor: summary.receitaTotalOrcada },
      { Métrica: 'Receita Total Reestimada', Valor: summary.receitaTotalReestimada },
      { Métrica: 'Receita Total Realizada', Valor: summary.receitaTotalRealizada },
      { Métrica: 'Despesa Total Liquidada', Valor: summary.despesaTotalLiquidada },
      { Métrica: 'Receita Corrente Líquida (RCL)', Valor: summary.rcl },
      { Métrica: 'Despesa com Pessoal (Executivo)', Valor: summary.despesaPessoalTotal },
      { Métrica: '% Pessoal da RCL', Valor: `${summary.despesaPessoalPercentualRCL}%` },
      { Métrica: 'Limite de Alerta LRF', Valor: '48,60%' },
      { Métrica: 'Limite Prudencial LRF', Valor: '51,30%' },
      { Métrica: 'Limite Legal LRF', Valor: '54,00%' },
      { Métrica: 'Aporte Previdenciário FPMA', Valor: summary.aportePrevidenciarioFPMA },
      { Métrica: 'Serviço da Dívida', Valor: summary.servicoDivida },
      { Métrica: 'Resultado Primário', Valor: summary.resultadoPrimario },
      { Métrica: 'Aplicação em Educação (%)', Valor: `${summary.aplicacaoEducacaoPercentual}% (Mín. 25%)` },
      { Métrica: 'Aplicação em Saúde (%)', Valor: `${summary.aplicacaoSaudePercentual}% (Mín. 15%)` },
      { Métrica: 'Aplicação FUNDEB Magistério (%)', Valor: `${summary.fundebMagisterioPercentual}% (Mín. 70%)` },
      { Métrica: 'Meta de Captação Externa (R$)', Valor: summary.metaCaptacaoAnual },
      { Métrica: 'Captação Realizada (R$)', Valor: summary.captacaoRealizada },
    ];
    exportToCSV(`relatorio_consolidado_araucaria_${ano}`, generalData);
  };

  const novasEmendas7Dias =
    captacao?.novasEmendas7Dias ??
    (captacao?.emendas ? captacao.emendas.filter(e => isEmendaRecente(e.dataProcessamento)).length : 0);

  return (
    <div className="dashboard-full min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white relative">
      {/* Dynamic Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onAction={handleTabChange}
        onClearAll={handleClearAllToasts}
      />

      {/* Header with identity, status and navigation tabs */}
      <Header
        anoSelecionado={ano}
        onSelectAno={setAno}
        siconfiStatus={siconfiStatus}
        loading={loading}
        onRefresh={() => loadAllData(ano)}
        onExportAllCSV={handleExportConsolidatedCSV}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        novasEmendas7Dias={novasEmendas7Dias}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={togglePresentationMode}
        tenantInfo={activeTenant}
        authRole={authRole}
        onChangeAuthRole={handleRoleChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Presentation Mode Slide & Control Dock (TCE-PR / Audiência Fiscal) */}
      {isPresentationMode && (
        <div
          className="bg-slate-900 border-b-2 border-amber-500 text-white px-3 sm:px-6 py-2 animate-in slide-in-from-top-2"
          style={{
            boxShadow: 'var(--sgf-shadow-lg)',
            position: 'sticky',
            top: '4rem',
            zIndex: 'var(--sgf-z-header)',
          }}
        >
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Left Info */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                MODO APRESENTAÇÃO • AUDIÊNCIA TCE-PR
              </span>
              <span className="hidden lg:inline text-xs font-mono text-slate-300">
                Prefeitura de Araucária/PR • Exercício {ano}
              </span>
            </div>

            {/* Slide Navigation (Previous, Current/Total, Next, Quick Module Pills) */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full">
              <button
                type="button"
                id="presentation-prev-slide-btn"
                onClick={() => {
                  const currentIndex = PRESENTATION_TABS.findIndex(t => t.id === activeTab);
                  const prevIndex = (currentIndex - 1 + PRESENTATION_TABS.length) % PRESENTATION_TABS.length;
                  handleTabChange(PRESENTATION_TABS[prevIndex].id);
                }}
                className="px-2.5 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                title="Slide Anterior (Tecla Seta Esquerda ou PageUp)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="px-3 py-1 bg-slate-950 rounded-sm border border-slate-800 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 shrink-0 shadow-inner">
                <span className="text-emerald-400">
                  {PRESENTATION_TABS.findIndex(t => t.id === activeTab) + 1}/8
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-200 hidden sm:inline truncate max-w-[220px]">
                  {PRESENTATION_TABS.find(t => t.id === activeTab)?.title}
                </span>
              </div>

              <button
                type="button"
                id="presentation-next-slide-btn"
                onClick={() => {
                  const currentIndex = PRESENTATION_TABS.findIndex(t => t.id === activeTab);
                  const nextIndex = (currentIndex + 1) % PRESENTATION_TABS.length;
                  handleTabChange(PRESENTATION_TABS[nextIndex].id);
                }}
                className="px-2.5 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                title="Próximo Slide (Tecla Seta Direita ou PageDown)"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Slide Numbers */}
              <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-800">
                {PRESENTATION_TABS.map((tab, idx) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-6 h-6 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={`Slide ${tab.num}: ${tab.title}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Right presentation controls: Year switch, Browser Fullscreen & Exit */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded-sm border border-slate-800">
                {[2024, 2025, 2026].map(y => (
                  <button
                    type="button"
                    key={y}
                    onClick={() => setAno(y)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-xs transition ${
                      ano === y ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    title={`Exercício ${y}`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <button
                type="button"
                id="presentation-fullscreen-toggle-btn"
                onClick={toggleBrowserFullscreen}
                className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                title={isBrowserFullscreen ? 'Sair da Tela Cheia (F11)' : 'Tela Cheia do Navegador (F11)'}
              >
                {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                id="presentation-exit-btn"
                onClick={togglePresentationMode}
                className="px-2.5 sm:px-3 py-1 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Sair do Modo Apresentação (Pressione Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Sair (Esc)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Expands to full screen width in Presentation Mode */}
      <main
        className={`flex-1 w-full transition-all duration-300 ${
          isPresentationMode
            ? 'px-2 sm:px-4 py-2'
            : 'px-3 sm:px-4 lg:px-6 py-4 pb-20 lg:pb-6'
        }`}
      >
        {/* Global Filter Bar - Hidden in Presentation Mode */}
        {!isPresentationMode && (
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedUnidade={selectedUnidade}
            onUnidadeChange={setSelectedUnidade}
            onResetFilters={handleResetFilters}
            comparativeMode={comparativeMode}
            onComparativeModeChange={handleComparativeModeChange}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            selectedQuarter={selectedQuarter}
            onQuarterChange={setSelectedQuarter}
            isComparativoAnual={isComparativoAnual}
            onToggleComparativoAnual={handleToggleComparativoAnual}
            anoAtual={ano}
          />
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => loadAllData(ano)}
              className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && !summary ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-slate-400">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Conectando aos dados contábeis de Araucária (Siconfi / Tesouro Nacional)...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'modulo1' && (
              summary ? (
                <Module1KPIs
                  summary={summary}
                  alerts={alerts}
                  ano={ano}
                  onNavigateToTab={handleTabChange}
                  isComparativoAnual={isComparativoAnual}
                  comparativeData={comparativeData}
                  activeMode={comparativeMode}
                  monthlyComparativeData={monthlyComparativeData}
                  quarterlyComparativeData={quarterlyComparativeData}
                  tenantInfo={activeTenant}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-mono text-slate-500">Carregando indicadores fiscais do Exercício {ano}...</p>
                </div>
              )
            )}

            {activeTab === 'modulo2' && (
              <Module2Receitas
                receitas={receitas}
                ano={ano}
                searchQuery={searchQuery}
                isComparativoAnual={isComparativoAnual}
                comparativeData={comparativeData}
                activeMode={comparativeMode}
                monthlyComparativeData={monthlyComparativeData}
                quarterlyComparativeData={quarterlyComparativeData}
              />
            )}

            {activeTab === 'modulo3' && (
              <Module3Despesas
                porNatureza={porNatureza}
                porFuncao={porFuncao}
                ano={ano}
                searchQuery={searchQuery}
                isComparativoAnual={isComparativoAnual}
                comparativeData={comparativeData}
                activeMode={comparativeMode}
                monthlyComparativeData={monthlyComparativeData}
                quarterlyComparativeData={quarterlyComparativeData}
              />
            )}

            {activeTab === 'modulo4' && (
              <Module4LRF limites={limites} ano={ano} onTriggerToast={addToast} />
            )}

            {activeTab === 'modulo5' && (
              captacao ? (
                <Module5Captacao
                  metaAnual={captacao.metaAnual}
                  captadoAcumulado={captacao.captadoAcumulado}
                  percentualAtingimento={captacao.percentualAtingimento}
                  emendas={captacao.emendas}
                  convenios={captacao.convenios}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-mono text-slate-500">Carregando dados de emendas e convênios Transferegov...</p>
                </div>
              )
            )}

            {activeTab === 'modulo6' && (
              fundeb ? (
                <Module6Fundeb fundebData={fundeb} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-mono text-slate-500">Carregando matrizes do FUNDEB e SIOPE...</p>
                </div>
              )
            )}

            {activeTab === 'siconfi' && (
              <ModuleSiconfiExplorer siconfiStatus={siconfiStatus} ano={ano} />
            )}

            {activeTab === 'diagnostico' && (
              summary ? (
                <ModuleAIDiagnostico summary={summary} ano={ano} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-mono text-slate-500">Gerando parecer técnico automatizado...</p>
                </div>
              )
            )}

            {activeTab === 'obras' && (
              <ModuleObrasMap
                obras={obrasData.obras}
                summary={obrasData.summary}
                ano={ano}
              />
            )}

            {activeTab === 'saas_admin' && (
              authRole === 'EMPRESA_MASTER' ? (
                <SaaSAdminPanel
                  activeTenantId={activeTenant.id}
                  onSelectTenantToPreview={(tenant) => {
                    setActiveTenant({
                      id: tenant.id,
                      nomePrefeitura: tenant.nomePrefeitura,
                      cidade: tenant.cidade,
                      uf: tenant.uf,
                      codigoIbge: tenant.codigoIbge,
                    });
                    setActiveTab('modulo1');
                    addToast({
                      type: 'info',
                      title: 'Ambiente Alternado',
                      message: `Workspace ativo agora é ${tenant.nomePrefeitura} (${tenant.uf}).`,
                    });
                  }}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-3xl mx-auto my-10 text-center space-y-5 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Acesso Restrito à Empresa Mantenedora (SaaS)
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Painel Master SaaS Exclusivo da Provedora
                    </h2>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                      Este módulo é exclusivo para administradores da empresa para cadastro de novas prefeituras, edição de planos, tarifação de usuários extras e parametrização técnica das APIs de integração.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-lg mx-auto text-xs text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Seu Perfil Atual: Prefeitura Municipal Cliente
                    </div>
                    <p className="text-slate-600">
                      Prefeitura Ativa: <strong>{activeTenant.nomePrefeitura} ({activeTenant.uf})</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Para cadastrar novos servidores, solicitar acréscimos de licença ou alterar conexões de API (Módulo 07), contate a equipe técnica da Empresa SaaS.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('EMPRESA_MASTER')}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Alternar para Perfil Empresa SaaS (Master)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('modulo1')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition cursor-pointer"
                    >
                      Ir para o Dashboard Municipal
                    </button>
                  </div>
                </div>
              )
            )}

            {activeTab === 'usuarios' && (
              <TenantUserManagement
                tenantId={activeTenant.id}
                tenantName={activeTenant.nomePrefeitura}
                authRole={authRole}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Quick Navigation Bar - Hidden in Presentation Mode */}
      {!isPresentationMode && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
          style={{ zIndex: 'var(--sgf-z-overlay)' }}
        >
          <button
            type="button"
            id="mobile-bottom-nav-modulo1"
            onClick={() => handleTabChange('modulo1')}
            className={`flex flex-col items-center py-1 px-2 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer ${
              activeTab === 'modulo1' ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Ir para o Dashboard Principal"
          >
            <span className="text-xs">📊</span>
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            id="mobile-bottom-nav-modulo2"
            onClick={() => handleTabChange('modulo2')}
            className={`flex flex-col items-center py-1 px-2 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer ${
              activeTab === 'modulo2' ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Ir para Receitas Orçamentárias"
          >
            <span className="text-xs">📈</span>
            <span>Receitas</span>
          </button>

          <button
            type="button"
            id="mobile-bottom-nav-modulo3"
            onClick={() => handleTabChange('modulo3')}
            className={`flex flex-col items-center py-1 px-2 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer ${
              activeTab === 'modulo3' ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Ir para Despesas e Funções"
          >
            <span className="text-xs">📉</span>
            <span>Despesas</span>
          </button>

          <button
            type="button"
            id="mobile-bottom-nav-modulo4"
            onClick={() => handleTabChange('modulo4')}
            className={`flex flex-col items-center py-1 px-2 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer ${
              activeTab === 'modulo4' ? 'text-amber-400 bg-amber-950/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Ir para Limites da LRF"
          >
            <span className="text-xs">⚖️</span>
            <span>LRF (50%)</span>
          </button>

          <button
            type="button"
            id="mobile-bottom-nav-more"
            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
            className={`flex flex-col items-center py-1 px-2 rounded-sm text-[10px] font-mono font-bold transition cursor-pointer relative ${
              ['modulo5', 'modulo6', 'siconfi', 'diagnostico', 'obras'].includes(activeTab) || mobileMoreOpen
                ? 'text-emerald-400 bg-emerald-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Mais módulos e opções"
          >
            <div className="relative inline-flex items-center justify-center">
              <span className="text-xs">📑</span>
              {novasEmendas7Dias > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <span>Mais...</span>
          </button>
        </div>
      )}

      {/* Mobile More Modules Sheet Modal */}
      {mobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end p-3 animate-in fade-in"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-md p-4 space-y-2 shadow-2xl max-h-[85vh] overflow-y-auto mb-14"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                TODOS OS 9 MÓDULOS DISPONÍVEIS
              </span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono font-bold p-1"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'modulo1', num: '01', title: 'Dashboard Principal', desc: 'KPIs executivos e semáforos', emoji: '📊' },
                { id: 'modulo2', num: '02', title: 'Receitas Orçamentárias', desc: 'ICMS/REPAR, ISS e reestimativa LOA', emoji: '📈' },
                { id: 'modulo3', num: '03', title: 'Despesas e Funções', desc: 'Execução orçamentária detalhada', emoji: '📉' },
                { id: 'modulo4', num: '04', title: 'Limites LRF & TCE-PR', desc: 'Folha 50,15%, Educação e Saúde', emoji: '⚖️' },
                {
                  id: 'modulo5',
                  num: '05',
                  title: 'Captação & Convênios',
                  desc: 'Emendas e Transferegov',
                  emoji: '🤝',
                  badge: novasEmendas7Dias > 0 ? `+${novasEmendas7Dias} novas (7d)` : undefined,
                },
                { id: 'modulo6', num: '06', title: 'Painel FUNDEB & SIOPE', desc: 'Magistério 74,2% e complementação', emoji: '🎓' },
                { id: 'siconfi', num: '07', title: 'API Siconfi Live', desc: 'Console de dados abertos Tesouro', emoji: '🏛️' },
                { id: 'diagnostico', num: '08', title: 'Diagnóstico IA Especialista', desc: 'Parecer técnico contábil', emoji: '✨' },
                { id: 'obras', num: '09', title: 'Mapa de Obras Públicas', desc: 'Geolocalização SVG e avanço físico', emoji: '📍', badge: 'Novo' },
              ].map(m => {
                const isActive = activeTab === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    id={`sheet-nav-${m.id}`}
                    onClick={() => handleTabChange(m.id)}
                    className={`text-left p-2.5 rounded-sm flex items-center gap-3 border transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950 border-emerald-500 text-white'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg relative">
                      {m.emoji}
                      {m.id === 'modulo5' && novasEmendas7Dias > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold font-mono uppercase text-white flex items-center justify-between">
                        <span>{m.num}. {m.title}</span>
                        {isActive && (
                          <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-sm">
                            ATIVO
                          </span>
                        )}
                        {!isActive && m.badge && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold px-1.5 py-0.2 rounded-sm">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer - Hidden in Presentation Mode */}
      {!isPresentationMode && (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12 mb-14 lg:mb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">
                Sistema de Monitoramento Fiscal Municipal — Prefeitura de Araucária/PR
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
              <span>Fontes: Siconfi / Tesouro Nacional • TCE-PR • Transferegov • FNDE • IBGE</span>
              <span>Código IBGE: 4101804</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
