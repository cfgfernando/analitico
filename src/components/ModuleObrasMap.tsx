import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  HeartPulse,
  GraduationCap,
  Trees,
  Shield,
  Trophy,
  Compass,
  Filter,
  Search,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  UserCheck,
  Building,
  ArrowUpRight,
  Maximize2,
  X,
  Share2,
} from 'lucide-react';
import { ObraAraucaria, ObraStatus, ObraSecretaria, ObraFonteRecurso, ObrasSummary } from '../types/fiscal';
import { formatCurrency, formatCompactCurrency, formatPercent, exportToCSV } from '../utils/formatters';
import { AraucariaSvgMap } from './AraucariaSvgMap';

interface ModuleObrasMapProps {
  obras: ObraAraucaria[];
  summary: ObrasSummary | null;
  ano: number;
}

export const ModuleObrasMap: React.FC<ModuleObrasMapProps> = ({
  obras: initialObras,
  summary: initialSummary,
  ano,
}) => {
  const [obrasList] = useState<ObraAraucaria[]>(initialObras);
  const [viewMode, setViewMode] = useState<'mapa' | 'grade'>('mapa');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedFaixaValor, setSelectedFaixaValor] = useState<string>('todas');
  const [selectedFonte, setSelectedFonte] = useState<string>('todas');

  // Selected Obra for Inspector
  const [selectedObra, setSelectedObra] = useState<ObraAraucaria | null>(
    initialObras.find(o => o.destaque) || initialObras[0] || null
  );

  // Filter logic
  const filteredObras = useMemo(() => {
    return obrasList.filter(obra => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        obra.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obra.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obra.empresaContratada.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obra.numeroContrato.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obra.secretariaNome.toLowerCase().includes(searchQuery.toLowerCase());

      // Secretaria
      const matchesSecretaria =
        selectedSecretaria === 'todas' || obra.secretaria === selectedSecretaria;

      // Status
      const matchesStatus =
        selectedStatus === 'todos' || obra.status === selectedStatus;

      // Faixa de Valor
      let matchesFaixa = true;
      if (selectedFaixaValor === 'ate5m') matchesFaixa = obra.valorPrevisto <= 5000000;
      else if (selectedFaixaValor === '5ma20m')
        matchesFaixa = obra.valorPrevisto > 5000000 && obra.valorPrevisto <= 20000000;
      else if (selectedFaixaValor === 'acima20m') matchesFaixa = obra.valorPrevisto > 20000000;

      // Fonte de Recurso
      const matchesFonte =
        selectedFonte === 'todas' || obra.fonteRecurso === selectedFonte;

      return matchesSearch && matchesSecretaria && matchesStatus && matchesFaixa && matchesFonte;
    });
  }, [obrasList, searchQuery, selectedSecretaria, selectedStatus, selectedFaixaValor, selectedFonte]);

  // Aggregate metrics for filtered data
  const totalFilteredInvestimento = filteredObras.reduce((acc, o) => acc + o.valorPrevisto, 0);
  const totalFilteredLiquidado = filteredObras.reduce((acc, o) => acc + o.valorLiquidado, 0);
  const totalFilteredEmExecucao = filteredObras.filter(o => o.status === 'Em Execução').length;
  const mediaFisicaFiltered =
    filteredObras.length > 0
      ? Number(
          (filteredObras.reduce((acc, o) => acc + o.progressoFisico, 0) / filteredObras.length).toFixed(1)
        )
      : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredObras.map(o => ({
      'Código': o.codigo,
      'Título da Obra': o.titulo,
      'Secretaria': `${o.secretaria} - ${o.secretariaNome}`,
      'Status de Investimento': o.status,
      'Bairro / Localidade': o.bairro,
      'Região': o.regiao,
      'Valor Previsto (R$)': o.valorPrevisto,
      'Valor Liquidado (R$)': o.valorLiquidado,
      'Saldo a Executar (R$)': o.valorPrevisto - o.valorLiquidado,
      'Progresso Físico (%)': o.progressoFisico,
      'Progresso Financeiro (%)': o.progressoFinanceiro,
      'Fonte de Recursos': o.fonteRecurso,
      'Empresa Contratada': o.empresaContratada,
      'Contrato Nº': o.numeroContrato,
      'Data Início': o.dataInicio,
      'Previsão de Conclusão': o.dataPrevisaoFim,
      'Beneficiários Estimados': o.beneficiariosEstimados || '-',
      'Impacto Social / Urbano': o.impactoSocial,
    }));

    exportToCSV(`obras_publicas_araucaria_${ano}`, exportData);
  };

  const getSecretariaIcon = (sec: ObraSecretaria) => {
    switch (sec) {
      case 'SMOP':
        return Building2;
      case 'SMSA':
        return HeartPulse;
      case 'SMED':
        return GraduationCap;
      case 'SMMA':
        return Trees;
      case 'SMSP':
        return Shield;
      case 'SMEL':
        return Trophy;
      case 'SMURB':
      case 'SMAS':
      default:
        return Compass;
    }
  };

  const getStatusBadgeStyle = (status: ObraStatus) => {
    switch (status) {
      case 'Em Execução':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Concluída':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Em Licitação':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Em Projeto':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      case 'Paralisada':
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Module Header */}
      <div className="bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm p-4 shadow-sm font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-xs bg-[#0a1128] text-white border border-navy-700 font-sans">
                MÓDULO 09 • INFRAESTRUTURA & OBRAS
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Exercício {ano}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white uppercase tracking-tight font-sans">
              MAPA DE OBRAS PÚBLICAS & INVESTIMENTOS DE ARAUCÁRIA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed font-medium">
              Visualização georreferenciada e analítica das obras municipais em execução, filtradas por secretaria setorial, status físico-financeiro e fontes de financiamento (Tesouro, Finisa, Federal e Paranacidade).
            </p>
          </div>

          {/* Action Controls: View Switch & Export */}
          <div className="flex items-center gap-2 self-start lg:self-center font-sans">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 dark:bg-navy-900 p-1 rounded-sm border border-slate-300 dark:border-navy-700 flex items-center text-xs font-sans">
              <button
                type="button"
                onClick={() => setViewMode('mapa')}
                className={`px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'mapa'
                    ? 'bg-[#0a1128] text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Mapa Georreferenciado
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grade')}
                className={`px-3 py-1.5 rounded-xs transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grade'
                    ? 'bg-[#0a1128] text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grade Analítica ({filteredObras.length})
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-[#0a1128] hover:bg-[#1a2a52] text-white rounded-sm text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Exportar planilha de obras em formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-navy-800">
          {/* KPI 1 */}
          <div className="p-3 bg-slate-50 dark:bg-navy-900/60 rounded-sm border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block">
              Investimento Total Mapeado
            </span>
            <div className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white mt-0.5 tabular-nums">
              {formatCurrency(totalFilteredInvestimento)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredObras.length} obras selecionadas
            </span>
          </div>

          {/* KPI 2 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block">
              Valor Liquidado / Executado
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(totalFilteredLiquidado)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {totalFilteredInvestimento > 0
                ? `${((totalFilteredLiquidado / totalFilteredInvestimento) * 100).toFixed(1)}% do orçamento liquidado`
                : '0%'}
            </span>
          </div>

          {/* KPI 3 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block">
              Obras Ativas em Execução
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {totalFilteredEmExecucao} em andamento
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {obrasList.filter(o => o.status === 'Concluída').length} concluídas • {obrasList.filter(o => o.status === 'Em Licitação').length} em licitação
            </span>
          </div>

          {/* KPI 4 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block">
              Progresso Físico Médio
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {mediaFisicaFiltered.toFixed(1)}%
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${mediaFisicaFiltered}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar (Secretarias, Status, Faixa, Busca) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-xs space-y-3">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar obra, bairro, contrato ou empresa..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secretaria Dropdown */}
          <div className="relative">
            <select
              value={selectedSecretaria}
              onChange={e => setSelectedSecretaria(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="todas">🏢 Todas as Secretarias ({obrasList.length})</option>
              <option value="SMOP">SMOP - Obras Públicas ({obrasList.filter(o => o.secretaria === 'SMOP').length})</option>
              <option value="SMSA">SMSA - Saúde ({obrasList.filter(o => o.secretaria === 'SMSA').length})</option>
              <option value="SMED">SMED - Educação ({obrasList.filter(o => o.secretaria === 'SMED').length})</option>
              <option value="SMMA">SMMA - Meio Ambiente ({obrasList.filter(o => o.secretaria === 'SMMA').length})</option>
              <option value="SMURB">SMURB - Urbanismo ({obrasList.filter(o => o.secretaria === 'SMURB').length})</option>
              <option value="SMSP">SMSP - Segurança Pública ({obrasList.filter(o => o.secretaria === 'SMSP').length})</option>
              <option value="SMEL">SMEL - Esporte e Lazer ({obrasList.filter(o => o.secretaria === 'SMEL').length})</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="todos">🚦 Todos os Status ({obrasList.length})</option>
              <option value="Em Execução">Em Execução ({obrasList.filter(o => o.status === 'Em Execução').length})</option>
              <option value="Em Licitação">Em Licitação ({obrasList.filter(o => o.status === 'Em Licitação').length})</option>
              <option value="Em Projeto">Em Projeto ({obrasList.filter(o => o.status === 'Em Projeto').length})</option>
              <option value="Concluída">Concluída ({obrasList.filter(o => o.status === 'Concluída').length})</option>
              <option value="Paralisada">Paralisada ({obrasList.filter(o => o.status === 'Paralisada').length})</option>
            </select>
          </div>

          {/* Fonte de Recursos Dropdown */}
          <div className="relative">
            <select
              value={selectedFonte}
              onChange={e => setSelectedFonte(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="todas">💰 Todas as Fontes de Recurso</option>
              <option value="Tesouro Municipal">Tesouro Municipal (Recursos Livres)</option>
              <option value="Finisa / Caixa">Finisa / Caixa Econômica Federal</option>
              <option value="Convênio Federal / Transferegov">Convênios Federais / Transferegov</option>
              <option value="Paranacidade / Estado">Paranacidade / Governo do Estado</option>
              <option value="FUNDEB / MDE">FUNDEB / Vinculação MDE</option>
            </select>
          </div>
        </div>

        {/* Row 2: Fast Filter Badges / Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-500" />
            Filtro Rápido:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedSecretaria('todas');
              setSelectedStatus('todos');
              setSelectedFonte('todas');
              setSearchQuery('');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer ${
              selectedSecretaria === 'todas' && selectedStatus === 'todos' && selectedFonte === 'todas' && searchQuery === ''
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            Todas ({obrasList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSecretaria('SMOP');
              setSelectedStatus('todos');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
              selectedSecretaria === 'SMOP'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-3 h-3" />
            SMOP Obras
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSecretaria('SMSA');
              setSelectedStatus('todos');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
              selectedSecretaria === 'SMSA'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <HeartPulse className="w-3 h-3" />
            SMSA Saúde
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSecretaria('SMED');
              setSelectedStatus('todos');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
              selectedSecretaria === 'SMED'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            SMED Educação
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStatus('Em Execução');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
              selectedStatus === 'Em Execução'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Apenas em Execução ({obrasList.filter(o => o.status === 'Em Execução').length})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedFaixaValor(selectedFaixaValor === 'acima20m' ? 'todas' : 'acima20m');
            }}
            className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
              selectedFaixaValor === 'acima20m'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            Macro Obras &gt; R$ 20M
          </button>
        </div>
      </div>

      {/* Main View Area: Either Map with Inspector or Analytical Grid */}
      {viewMode === 'mapa' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Araucária SVG Map (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <AraucariaSvgMap
              obras={filteredObras}
              selectedObraId={selectedObra?.id || null}
              onSelectObra={obra => setSelectedObra(obra)}
              selectedSecretaria={selectedSecretaria}
              selectedStatus={selectedStatus}
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Interatividade: Clique nos marcadores ou setores para inspecionar contratos e cronogramas.
              </span>
              <span>{filteredObras.length} de {obrasList.length} obras visíveis</span>
            </div>
          </div>

          {/* Right Column: Detailed Obra Inspector Card (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-xs space-y-4">
            {selectedObra ? (
              <div className="space-y-4">
                {/* Header with Title and Badges */}
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {selectedObra.codigo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadgeStyle(selectedObra.status)}`}>
                      {selectedObra.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                    {selectedObra.titulo}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{selectedObra.bairro} ({selectedObra.regiao})</span>
                  </div>
                </div>

                {/* Financial Progress & Gauge */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Valor Contratado:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(selectedObra.valorPrevisto)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Valor Já Liquidado:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedObra.valorLiquidado)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Saldo a Executar:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(selectedObra.valorPrevisto - selectedObra.valorLiquidado)}
                    </span>
                  </div>

                  {/* Dual Progress Bars: Físico vs Financeiro */}
                  <div className="pt-2 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                        <span>Avanço Físico no Canteiro:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedObra.progressoFisico.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${selectedObra.progressoFisico}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                        <span>Execução Financeira (Pagamentos):</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedObra.progressoFinanceiro.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${selectedObra.progressoFinanceiro}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract & Technical Details */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Secretaria Gestora:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">
                      {selectedObra.secretaria} — {selectedObra.secretariaNome}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Fonte de Recurso:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-right">
                      {selectedObra.fonteRecurso}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Contrato:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedObra.numeroContrato}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Contratada:</span>
                    <span className="text-slate-900 dark:text-white font-semibold text-right truncate max-w-[180px]">
                      {selectedObra.empresaContratada}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400">Cronograma:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {selectedObra.dataInicio} → {selectedObra.dataPrevisaoFim}
                    </span>
                  </div>

                  {selectedObra.beneficiariosEstimados && (
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-slate-400">População Beneficiada:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ~{selectedObra.beneficiariosEstimados.toLocaleString('pt-BR')} cidadãos
                      </span>
                    </div>
                  )}
                </div>

                {/* Description & Social Impact */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    Memorial Descritivo & Impacto Social
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {selectedObra.descricao}
                  </p>
                  <div className="p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-[11px] text-indigo-900 dark:text-indigo-200">
                    <strong className="block text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase">Impacto para Araucária:</strong>
                    {selectedObra.impactoSocial}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-bounce" />
                <p className="text-xs font-mono">Selecione uma obra no mapa ou na lista ao lado para ver a ficha técnica completa.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Analytical Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObras.map(obra => {
            const Icon = getSecretariaIcon(obra.secretaria);
            return (
              <div
                key={obra.id}
                onClick={() => {
                  setSelectedObra(obra);
                  setViewMode('mapa');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-sm p-4 shadow-xs transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {obra.codigo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getStatusBadgeStyle(obra.status)}`}>
                      {obra.status}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                        {obra.titulo}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {obra.secretaria} • {obra.bairro}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {obra.descricao}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">Investimento Total:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(obra.valorPrevisto)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Avanço Físico:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{obra.progressoFisico.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${obra.progressoFisico}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-indigo-600 dark:text-indigo-400 pt-1">
                    <span>{obra.fonteRecurso}</span>
                    <span className="flex items-center gap-0.5 font-bold">
                      Ver no Mapa →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
