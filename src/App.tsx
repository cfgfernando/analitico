import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { ToastContainer } from './components/Toast';
import { ToastMessage, ComparativeMode } from './types/fiscal';
import { DashboardPage } from './pages/DashboardPage';
import { AuthProvider, useAuthContext, AuthRole } from './contexts/AuthContext';
import { TenantProvider, useTenantContext, TenantInfoState } from './contexts/TenantContext';
import { useFiscalData } from './hooks/useFiscalData';
import { exportToCSV, isEmendaRecente } from './utils/formatters';
import { buildMonthlyComparativeAnalysis, buildQuarterlyComparativeAnalysis } from './utils/comparative';
import {
  Building,
  Presentation,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const PRESENTATION_TABS = [
  { id: 'painel_prefeito', num: 'PREF', title: 'Painel do Prefeito', badge: 'Gabinete Executivo' },
  { id: 'benchmark', num: '07', title: 'Benchmark Regional', badge: 'Comparativo' },
  { id: 'selo', num: '08', title: 'Selo de Conformidade Fiscal', badge: 'Oficial' },
  { id: 'alertas_prazos', num: '09', title: 'Alertas & Prazos Críticos', badge: 'Radar Riscos' },
  { id: 'modulo1', num: '01', title: 'Dashboard Executivo & KPIs', badge: 'Semáforos Fiscais' },
  { id: 'modulo2', num: '02', title: 'Receitas Orçamentárias & IBS', badge: 'Arrecadação & EC 132' },
  { id: 'modulo3', num: '03', title: 'Despesas e Funções de Governo', badge: 'Saúde, Educação, Obras' },
  { id: 'modulo4', num: '04', title: 'Limites LRF & Gastos Pessoal', badge: 'Folha 50,15% e Pisos' },
  { id: 'modulo5', num: '05', title: 'Captação Externa & Transferegov', badge: 'Emendas & Convênios' },
  { id: 'modulo6', num: '06', title: 'FUNDEB, VAAT/VAAR & SIOPE', badge: 'Magistério 74,2%' },
  { id: 'diagnostico', num: 'IA', title: 'Diagnóstico IA Especialista', badge: 'Parecer Técnico' },
  { id: 'obras', num: 'GEO', title: 'Mapa Georreferenciado de Obras', badge: 'Infraestrutura' },
  { id: 'siconfi', num: 'API', title: 'API Siconfi Live (Tesouro Nacional)', badge: 'Dados Abertos' },
];

function MainDashboardApp() {
  const { authRole, setAuthRole } = useAuthContext();
  const { activeTenant, setActiveTenant } = useTenantContext();

  const [ano, setAno] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<string>('painel_prefeito');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sidebar Retrátil States (Padrão: Fechada / Collapsed para tela limpa)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sgf_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleTogglePinned = () => {
    setIsSidebarPinned(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sgf_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgf_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {}
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('sgf_dark_mode', String(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  // Comparative states
  const [comparativeMode, setComparativeMode] = useState<ComparativeMode>('anual');
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [isComparativoAnual, setIsComparativoAnual] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('todos');
  const [selectedUnidade, setSelectedUnidade] = useState<string>('todas');

  // Fiscal Data Hook
  const {
    loading,
    error,
    summary,
    receitas,
    porNatureza,
    porFuncao,
    limites,
    captacao,
    fundeb,
    alerts,
    obrasData,
    siconfiStatus,
    comparativeData,
    refetch,
  } = useFiscalData(activeTenant.id, activeTenant.codigoIbge, ano, isComparativoAnual);

  // Toast Helpers
  const addToast = (toastData: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setToasts(prev => [newToast, ...prev.filter(t => t.title !== newToast.title)].slice(0, 4));
  };

  const handleRoleChange = (newRole: AuthRole) => {
    setAuthRole(newRole);
    addToast({
      type: newRole === 'EMPRESA_MASTER' ? 'info' : 'success',
      title: `Perfil: ${newRole === 'EMPRESA_MASTER' ? '🏢 Empresa SaaS (Master)' : `🏛️ ${activeTenant.cidade} (Cliente)`}`,
      message: newRole === 'EMPRESA_MASTER' ? 'Gestão SaaS Master liberada.' : `Acesso à ${activeTenant.nomePrefeitura}.`,
    });
  };

  const handleTenantSelect = (tenant: any) => {
    setActiveTenant({
      id: tenant.id || `tenant-${tenant.codigoIbge}`,
      nomePrefeitura: tenant.nomePrefeitura,
      cidade: tenant.cidade,
      uf: tenant.uf,
      codigoIbge: tenant.codigoIbge,
    });
    addToast({
      type: 'success',
      title: `Prefeitura: ${tenant.cidade} (${tenant.uf})`,
      message: `Carregando dados fiscais de ${tenant.nomePrefeitura} (IBGE ${tenant.codigoIbge}).`,
    });
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

  // Comparatives
  const monthlyComparativeData = useMemo(() => {
    if (!summary || !isComparativoAnual) return null;
    return buildMonthlyComparativeAnalysis(ano, selectedMonth, receitas, porNatureza, porFuncao);
  }, [summary, receitas, porNatureza, porFuncao, ano, selectedMonth, isComparativoAnual]);

  const quarterlyComparativeData = useMemo(() => {
    if (!summary || !isComparativoAnual) return null;
    return buildQuarterlyComparativeAnalysis(ano, selectedQuarter, receitas, porNatureza, porFuncao);
  }, [summary, receitas, porNatureza, porFuncao, ano, selectedQuarter, isComparativoAnual]);

  const handleExportGeneralReport = () => {
    if (!summary) return;
    const generalData = [
      { Métrica: 'Município', Valor: `${activeTenant.nomePrefeitura} (${activeTenant.uf})` },
      { Métrica: 'Exercício', Valor: ano },
      { Métrica: 'Receita Corrente Líquida (R$)', Valor: summary.rcl },
      { Métrica: 'Despesa com Pessoal (% RCL)', Valor: `${summary.despesaPessoalPercentualRCL}% (Legal 54%)` },
      { Métrica: 'Aplicação em Educação (%)', Valor: `${summary.aplicacaoEducacaoPercentual}% (Mín. 25%)` },
      { Métrica: 'Aplicação em Saúde (%)', Valor: `${summary.aplicacaoSaudePercentual}% (Mín. 15%)` },
    ];
    exportToCSV(`relatorio_consolidado_${activeTenant.cidade.toLowerCase()}_${ano}`, generalData);
  };

  const novasEmendas7Dias =
    captacao?.novasEmendas7Dias ??
    (captacao?.emendas ? captacao.emendas.filter(e => isEmendaRecente(e.dataProcessamento)).length : 0);

  const togglePresentationMode = () => setIsPresentationMode(prev => !prev);
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsBrowserFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsBrowserFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="dashboard-full min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white relative">
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        onAction={setActiveTab}
        onClearAll={() => setToasts([])}
      />

      {/* Sidebar Retrátil Lateral Sofisticada */}
      {!isPresentationMode && (
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onToggleOpen={handleToggleSidebar}
          isPinned={isSidebarPinned}
          onTogglePinned={handleTogglePinned}
          authRole={authRole}
          novasEmendas7Dias={novasEmendas7Dias}
          cidade={activeTenant.cidade}
        />
      )}

      {/* Main Layout Area com Margem Dinâmica da Sidebar */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          !isPresentationMode
            ? isSidebarPinned && isSidebarOpen
              ? 'pl-72'
              : 'pl-16'
            : 'pl-0'
        }`}
      >
        <Header
          anoSelecionado={ano}
          onSelectAno={setAno}
          siconfiStatus={siconfiStatus}
          loading={loading}
          onRefresh={refetch}
          onExportAllCSV={handleExportGeneralReport}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          novasEmendas7Dias={novasEmendas7Dias}
          isPresentationMode={isPresentationMode}
          onTogglePresentationMode={togglePresentationMode}
          tenantInfo={activeTenant}
          authRole={authRole}
          onChangeAuthRole={handleRoleChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Presentation Mode Slide Bar */}
        {isPresentationMode && (
          <div className="bg-slate-900 border-b-2 border-amber-500 text-white px-3 sm:px-6 py-2 sticky top-0 z-40 shadow-lg">
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                  MODO APRESENTAÇÃO • AUDIÊNCIA TCE-PR
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {activeTenant.nomePrefeitura} • Exercício {ano}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currIdx = PRESENTATION_TABS.findIndex(t => t.id === activeTab);
                    const prevIdx = (currIdx - 1 + PRESENTATION_TABS.length) % PRESENTATION_TABS.length;
                    setActiveTab(PRESENTATION_TABS[prevIdx].id);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800 text-xs font-bold text-amber-400 font-mono">
                  {PRESENTATION_TABS.findIndex(t => t.id === activeTab) + 1}/13 • {PRESENTATION_TABS.find(t => t.id === activeTab)?.title}
                </div>

                <button
                  onClick={() => {
                    const currIdx = PRESENTATION_TABS.findIndex(t => t.id === activeTab);
                    const nextIdx = (currIdx + 1) % PRESENTATION_TABS.length;
                    setActiveTab(PRESENTATION_TABS[nextIdx].id);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={toggleBrowserFullscreen}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  title="Tela cheia do navegador"
                >
                  {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={togglePresentationMode}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-4 transition-all duration-300 pb-16">
          <DashboardPage
            activeTab={activeTab}
            ano={ano}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedUnidade={selectedUnidade}
            setSelectedUnidade={setSelectedUnidade}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isComparativoAnual={isComparativoAnual}
            onToggleComparativoAnual={setIsComparativoAnual}
            comparativeMode={comparativeMode}
            onComparativeModeChange={setComparativeMode}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            selectedQuarter={selectedQuarter}
            onQuarterChange={setSelectedQuarter}
            onResetFilters={handleResetFilters}
            summary={summary}
            receitas={receitas}
            porNatureza={porNatureza}
            porFuncao={porFuncao}
            limites={limites}
            captacao={captacao}
            fundeb={fundeb}
            alerts={alerts}
            obrasData={obrasData}
            siconfiStatus={siconfiStatus}
            comparativeData={comparativeData}
            monthlyComparativeData={monthlyComparativeData}
            quarterlyComparativeData={quarterlyComparativeData}
            activeTenant={activeTenant}
            authRole={authRole}
            onNavigateToTab={setActiveTab}
            onAddToast={addToast}
            onSelectTenant={handleTenantSelect}
            isPresentationMode={isPresentationMode}
          />
        </main>

        {!isPresentationMode && (
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">
                  Sistema de Monitoramento Fiscal Municipal — {activeTenant.nomePrefeitura}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-mono text-[11px]">
                <span>Fontes: Siconfi / Tesouro Nacional • TCE • Transferegov • FNDE • IBGE</span>
                <span>Código IBGE: {activeTenant.codigoIbge}</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <MainDashboardApp />
      </TenantProvider>
    </AuthProvider>
  );
}
