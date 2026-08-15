import React from 'react';
import { Search, RotateCcw, Building2, Calendar, ArrowLeftRight, TrendingUp, Sparkles, Percent, CalendarDays, BarChart3 } from 'lucide-react';
import { ComparativeMode, DataSourceMetadata } from '../types/fiscal';
import { MONTH_NAMES, QUARTERS_INFO } from '../utils/comparative';
import { DataSourceBadge } from './DataSourceBadge';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPeriod: string;
  onPeriodChange: (p: string) => void;
  selectedUnidade: string;
  onUnidadeChange: (u: string) => void;
  onResetFilters: () => void;
  comparativeMode?: ComparativeMode;
  onComparativeModeChange?: (mode: ComparativeMode) => void;
  selectedQuarter?: number;
  onQuarterChange?: (quarter: number) => void;
  selectedMonth?: number;
  onMonthChange?: (month: number) => void;
  isComparativoAnual?: boolean;
  onToggleComparativoAnual?: (enabled: boolean) => void;
  anoAtual?: number;
  dataSource?: DataSourceMetadata;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
  selectedUnidade,
  onUnidadeChange,
  onResetFilters,
  comparativeMode = 'nenhum',
  onComparativeModeChange,
  selectedQuarter = 1,
  onQuarterChange,
  selectedMonth = 8,
  onMonthChange,
  isComparativoAnual = false,
  onToggleComparativoAnual,
  anoAtual = 2026,
  dataSource,
}) => {
  const anoAnterior = anoAtual - 1;

  // Determine active mode (compatible with both comparativeMode prop and legacy isComparativoAnual)
  const activeMode: ComparativeMode =
    comparativeMode === 'anual' || comparativeMode === 'trimestral' || comparativeMode === 'mensal'
      ? comparativeMode
      : isComparativoAnual
      ? 'anual'
      : 'nenhum';

  const setMode = (mode: ComparativeMode) => {
    if (onComparativeModeChange) {
      onComparativeModeChange(mode);
    }
    if (onToggleComparativoAnual) {
      onToggleComparativoAnual(mode === 'anual');
    }
  };

  const isFiltered =
    searchQuery !== '' ||
    selectedPeriod !== 'todos' ||
    selectedUnidade !== 'todas' ||
    activeMode !== 'nenhum';

  const mesAtualNome = MONTH_NAMES[selectedMonth - 1] || 'Agosto';
  const mesAnteriorIndex = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const mesAnteriorNome = MONTH_NAMES[mesAnteriorIndex - 1] || 'Julho';

  const activeQuarterMeta = QUARTERS_INFO.find(q => q.trimestre === selectedQuarter) || QUARTERS_INFO[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-3 shadow-sm mb-6 transition-colors space-y-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="filtro-busca-global"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por conta contábil, fonte, órgão, função ou parlamentar..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-sans bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Filters & Mode Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Comparative Mode Selector Tabs */}
          <div className="flex items-center rounded-sm p-0.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
            {/* Standard Mode */}
            <button
              type="button"
              id="btn-modo-padrao"
              onClick={() => setMode('nenhum')}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'nenhum'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={`Exibir valores nominais do exercício ${anoAtual}`}
            >
              <span>Exercício {anoAtual}</span>
            </button>

            {/* Annual Comparative */}
            <button
              type="button"
              id="btn-modo-comparativo-anual"
              onClick={() => setMode('anual')}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'anual'
                  ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={`Alternar para Comparativo Anual (${anoAtual} vs ${anoAnterior}) com variações percentuais (%)`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Comp. Anual</span>
              <span
                className={`px-1.5 py-0.2 text-[9px] rounded-xs font-mono ${
                  activeMode === 'anual'
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {anoAtual} vs {anoAnterior}
              </span>
            </button>

            {/* Quarterly Comparative */}
            <button
              type="button"
              id="btn-modo-comparativo-trimestral"
              onClick={() => setMode('trimestral')}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'trimestral'
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={`Alternar para Comparativo Trimestral (ex: Q1 ${anoAtual} vs Q1 ${anoAnterior}) com visão consolidada de 3 meses`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comp. Trimestral</span>
              <span
                className={`px-1.5 py-0.2 text-[9px] rounded-xs font-mono ${
                  activeMode === 'trimestral'
                    ? 'bg-indigo-800 text-indigo-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {activeQuarterMeta.trimestreNome} {anoAtual} vs {anoAnterior}
              </span>
            </button>

            {/* Monthly Comparative */}
            <button
              type="button"
              id="btn-modo-comparativo-mensal"
              onClick={() => setMode('mensal')}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'mensal'
                  ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Alternar para Comparativo Mensal (Mês X vs Mês X-1) com variações percentuais (%)"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Comp. Mensal</span>
              <span
                className={`px-1.5 py-0.2 text-[9px] rounded-xs font-mono ${
                  activeMode === 'mensal'
                    ? 'bg-blue-800 text-blue-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Mês vs Mês-1
              </span>
            </button>
          </div>

          {/* Quarter Selector for Quarterly Comparative */}
          {activeMode === 'trimestral' && onQuarterChange && (
            <div className="flex items-center space-x-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-sm px-2.5 py-1 text-xs text-indigo-900 dark:text-indigo-200 animate-fadeIn">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Trimestre:</span>
              <select
                id="filtro-trimestre-comparativo-select"
                value={selectedQuarter}
                onChange={e => onQuarterChange(parseInt(e.target.value, 10))}
                className="bg-transparent border-none focus:outline-none font-semibold text-indigo-950 dark:text-indigo-100 cursor-pointer text-xs"
              >
                <option value={1} className="text-slate-900 bg-white dark:bg-slate-900">1º Trimestre — Q1 (Jan-Mar: Q1 {anoAtual} vs Q1 {anoAnterior})</option>
                <option value={2} className="text-slate-900 bg-white dark:bg-slate-900">2º Trimestre — Q2 (Abr-Jun: Q2 {anoAtual} vs Q2 {anoAnterior})</option>
                <option value={3} className="text-slate-900 bg-white dark:bg-slate-900">3º Trimestre — Q3 (Jul-Set: Q3 {anoAtual} vs Q3 {anoAnterior})</option>
                <option value={4} className="text-slate-900 bg-white dark:bg-slate-900">4º Trimestre — Q4 (Out-Dez: Q4 {anoAtual} vs Q4 {anoAnterior})</option>
              </select>
            </div>
          )}

          {/* Month Selector for Monthly Comparative */}
          {activeMode === 'mensal' && onMonthChange && (
            <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-sm px-2.5 py-1 text-xs text-blue-900 dark:text-blue-200 animate-fadeIn">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-mono text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Mês Base:</span>
              <select
                id="filtro-mes-comparativo-select"
                value={selectedMonth}
                onChange={e => onMonthChange(parseInt(e.target.value, 10))}
                className="bg-transparent border-none focus:outline-none font-semibold text-blue-950 dark:text-blue-100 cursor-pointer text-xs"
              >
                <option value={8} className="text-slate-900 bg-white dark:bg-slate-900">Agosto (Ago vs Jul)</option>
                <option value={7} className="text-slate-900 bg-white dark:bg-slate-900">Julho (Jul vs Jun)</option>
                <option value={6} className="text-slate-900 bg-white dark:bg-slate-900">Junho (Jun vs Mai)</option>
                <option value={5} className="text-slate-900 bg-white dark:bg-slate-900">Maio (Mai vs Abr)</option>
                <option value={4} className="text-slate-900 bg-white dark:bg-slate-900">Abril (Abr vs Mar)</option>
                <option value={3} className="text-slate-900 bg-white dark:bg-slate-900">Março (Mar vs Fev)</option>
                <option value={2} className="text-slate-900 bg-white dark:bg-slate-900">Fevereiro (Fev vs Jan)</option>
                <option value={1} className="text-slate-900 bg-white dark:bg-slate-900">Janeiro (Jan vs Dez/Ant)</option>
                <option value={9} className="text-slate-900 bg-white dark:bg-slate-900">Setembro (Set vs Ago)</option>
                <option value={10} className="text-slate-900 bg-white dark:bg-slate-900">Outubro (Out vs Set)</option>
                <option value={11} className="text-slate-900 bg-white dark:bg-slate-900">Novembro (Nov vs Out)</option>
                <option value={12} className="text-slate-900 bg-white dark:bg-slate-900">Dezembro (Dez vs Nov)</option>
              </select>
            </div>
          )}

          {/* Period selector */}
          {activeMode === 'nenhum' && (
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Período:</span>
              <select
                id="filtro-periodo-select"
                value={selectedPeriod}
                onChange={e => onPeriodChange(e.target.value)}
                className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
              >
                <option value="todos">Exercício Completo (Acumulado)</option>
                <option value="b1">1º Bimestre (Jan-Fev)</option>
                <option value="b2">2º Bimestre (Mar-Abr)</option>
                <option value="b3">3º Bimestre (Mai-Jun)</option>
                <option value="b4">4º Bimestre (Jul-Ago)</option>
                <option value="q1">1º Quadrimestre (LRF)</option>
                <option value="q2">2º Quadrimestre (LRF)</option>
                <option value="q3">3º Quadrimestre (LRF)</option>
              </select>
            </div>
          )}

          {/* Unit selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Unidade:</span>
            <select
              id="filtro-unidade-select"
              value={selectedUnidade}
              onChange={e => onUnidadeChange(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
            >
              <option value="todas">Consolidado Municipal (Todos os Órgãos)</option>
              <option value="prefeitura">Prefeitura Municipal (Executivo)</option>
              <option value="saude">Fundo Municipal de Saúde (FMS)</option>
              <option value="educacao">Secretaria Municipal de Educação (SMED)</option>
              <option value="fpma">FPMA - Fundo de Previdência Municipal</option>
              <option value="camara">Câmara Municipal de Araucária</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm transition cursor-pointer"
              title="Limpar todos os filtros e retornar ao modo padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}

          <div className="hidden lg:flex items-center pl-2 border-l border-slate-200 dark:border-slate-700">
            <DataSourceBadge dataSource={dataSource} size="sm" showDetails />
          </div>
        </div>
      </div>

      {/* Annual Comparative Active Helper Banner */}
      {activeMode === 'anual' && (
        <div className="pt-2 border-t border-emerald-100 dark:border-emerald-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
            <span className="inline-flex items-center justify-center p-1 rounded-xs bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800">
              <Percent className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span>
              <strong>MODO COMPARATIVO ANUAL (YoY) ATIVO:</strong> Exibindo variação percentual (%) e nominal entre os exercícios <strong>{anoAtual}</strong> e <strong>{anoAnterior}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500"></span> Variação Positiva (+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-rose-500"></span> Variação Negativa (-)
            </span>
          </div>
        </div>
      )}

      {/* Quarterly Comparative Active Helper Banner */}
      {activeMode === 'trimestral' && (
        <div className="pt-2 border-t border-indigo-100 dark:border-indigo-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-mono text-[11px]">
            <span className="inline-flex items-center justify-center p-1 rounded-xs bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </span>
            <span>
              <strong>MODO COMPARATIVO TRIMESTRAL ATIVO:</strong> Exibindo execução acumulada de <strong>{activeQuarterMeta.trimestreNome} ({activeQuarterMeta.meses.join(', ')})</strong> comparando <strong>{anoAtual} vs {anoAnterior}</strong> com visão consolidada trimestral.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500"></span> Desempenho Superior (+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-rose-500"></span> Desempenho Inferior (-)
            </span>
          </div>
        </div>
      )}

      {/* Monthly Comparative Active Helper Banner */}
      {activeMode === 'mensal' && (
        <div className="pt-2 border-t border-blue-100 dark:border-blue-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-mono text-[11px]">
            <span className="inline-flex items-center justify-center p-1 rounded-xs bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800">
              <CalendarDays className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </span>
            <span>
              <strong>MODO COMPARATIVO MENSAL (MoM) ATIVO:</strong> Exibindo variação mês a mês entre <strong>{mesAtualNome}</strong> e <strong>{mesAnteriorNome}</strong> do exercício <strong>{anoAtual}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500"></span> Aumento (+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-rose-500"></span> Redução (-)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

