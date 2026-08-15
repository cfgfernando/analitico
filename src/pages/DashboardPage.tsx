import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { Module1KPIs } from '../components/Module1KPIs';
import { Module2Receitas } from '../components/Module2Receitas';
import { Module3Despesas } from '../components/Module3Despesas';
import { Module4LRF } from '../components/Module4LRF';
import { Module5Captacao } from '../components/Module5Captacao';
import { Module6Fundeb } from '../components/Module6Fundeb';
import { ModuleSiconfiExplorer } from '../components/ModuleSiconfiExplorer';
import { ModuleAIDiagnostico } from '../components/ModuleAIDiagnostico';
import { ModuleObrasMap } from '../components/ModuleObrasMap';
import { SaaSAdminPanel } from '../components/SaaSAdminPanel';
import { TenantUserManagement } from '../components/TenantUserManagement';
import {
  FiscalKPIs,
  RevenueSource,
  ExpenseNature,
  ExpenseFunction,
  LRFLimit,
  FundebData,
  FiscalAlert,
  EmendaParlamentar,
  ConvenioRecurso,
  ObraAraucaria,
  ObrasSummary,
  SiconfiApiStatus,
  ComparativeAnalysis,
  ComparativeMode,
  MonthlyComparativeAnalysis,
  QuarterlyComparativeAnalysis,
  ToastMessage,
} from '../types/fiscal';
import { RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  activeTab: string;
  ano: number;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedUnidade: string;
  setSelectedUnidade: (unidade: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isComparativoAnual: boolean;
  onToggleComparativoAnual: (enabled: boolean) => void;
  comparativeMode: ComparativeMode;
  onComparativeModeChange: (mode: ComparativeMode) => void;
  selectedMonth: number;
  onMonthChange: (m: number) => void;
  selectedQuarter: number;
  onQuarterChange: (q: number) => void;
  onResetFilters: () => void;
  summary: FiscalKPIs | null;
  receitas: RevenueSource[];
  porNatureza: ExpenseNature[];
  porFuncao: ExpenseFunction[];
  limites: LRFLimit[];
  captacao: {
    metaAnual: number;
    captadoAcumulado: number;
    percentualAtingimento: string;
    novasEmendas7Dias?: number;
    emendas: EmendaParlamentar[];
    convenios: ConvenioRecurso[];
  } | null;
  fundeb: FundebData | null;
  alerts: FiscalAlert[];
  obrasData: { obras: ObraAraucaria[]; summary: ObrasSummary | null };
  siconfiStatus: SiconfiApiStatus | null;
  comparativeData: ComparativeAnalysis | null;
  monthlyComparativeData: MonthlyComparativeAnalysis | null;
  quarterlyComparativeData: QuarterlyComparativeAnalysis | null;
  activeTenant: { id: string; nomePrefeitura: string; cidade: string; uf: string; codigoIbge: string };
  authRole: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE';
  onNavigateToTab: (tabId: string) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  onSelectTenant: (tenant: any) => void;
  isPresentationMode?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  activeTab,
  ano,
  selectedPeriod,
  setSelectedPeriod,
  selectedUnidade,
  setSelectedUnidade,
  searchQuery,
  setSearchQuery,
  isComparativoAnual,
  onToggleComparativoAnual,
  comparativeMode,
  onComparativeModeChange,
  selectedMonth,
  onMonthChange,
  selectedQuarter,
  onQuarterChange,
  onResetFilters,
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
  monthlyComparativeData,
  quarterlyComparativeData,
  activeTenant,
  authRole,
  onNavigateToTab,
  onAddToast,
  onSelectTenant,
  isPresentationMode = false,
}) => {
  return (
    <>
      {!isPresentationMode && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedUnidade={selectedUnidade}
          onUnidadeChange={setSelectedUnidade}
          onResetFilters={onResetFilters}
          comparativeMode={comparativeMode}
          onComparativeModeChange={onComparativeModeChange}
          selectedQuarter={selectedQuarter}
          onQuarterChange={onQuarterChange}
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          isComparativoAnual={isComparativoAnual}
          onToggleComparativoAnual={onToggleComparativoAnual}
          anoAtual={ano}
          dataSource={summary?.dataSource}
        />
      )}

      <div>
        {activeTab === 'modulo1' && (
          summary ? (
            <Module1KPIs
              summary={summary}
              alerts={alerts}
              ano={ano}
              onNavigateToTab={onNavigateToTab}
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
          <Module4LRF limites={limites} ano={ano} onTriggerToast={onAddToast} />
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
              <p className="text-sm font-mono text-slate-500">Carregando dados de emendas e convênios...</p>
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
              onSelectTenantToPreview={onSelectTenant}
            />
          ) : (
            <TenantUserManagement
              tenantId={activeTenant.id}
              tenantName={activeTenant.nomePrefeitura}
              authRole={authRole}
            />
          )
        )}
      </div>
    </>
  );
};
