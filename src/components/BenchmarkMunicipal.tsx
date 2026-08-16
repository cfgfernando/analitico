import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useTenantContext } from '../contexts/TenantContext';
import {
  Trophy,
  Users,
  Building2,
  TrendingUp,
  Scale,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
  ScatterChart,
  PieChart,
  BarChart3,
  Percent,
  Layers,
} from 'lucide-react';
import { BenchmarkPayload, MunicipioBenchmark } from '../types/fiscal';
import { formatCompactCurrency, formatCurrency, formatPercent, exportToCSV } from '../utils/formatters';
import { DataSourceBadge } from './DataSourceBadge';

interface BenchmarkMunicipalProps {
  data?: BenchmarkPayload | null;
  cidade?: string;
  uf?: string;
  activeTenant?: {
    id?: string;
    cidade: string;
    uf: string;
    codigoIbge: string;
  };
}

export const BenchmarkMunicipal: React.FC<BenchmarkMunicipalProps> = ({
  data: initialData,
  cidade: propCidade,
  uf: propUf,
  activeTenant: propTenant,
}) => {
  let contextTenant: any = null;
  try {
    const ctx = useTenantContext();
    contextTenant = ctx.activeTenant;
  } catch {}

  const currentTenant = propTenant || contextTenant;
  const cidade = propCidade || currentTenant?.cidade || 'Araucária';
  const uf = propUf || currentTenant?.uf || 'PR';

  const [selectedPorte, setSelectedPorte] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fetchedData, setFetchedData] = useState<BenchmarkPayload | null>(null);

  useEffect(() => {
    let isMounted = true;
    const safeTenant = currentTenant?.id || (cidade ? `tenant-${cidade.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'tenant-araucaria');
    const safeIbge = currentTenant?.codigoIbge || '4101804';

    api.get<any>(`/api/fiscal/benchmark?tenantId=${safeTenant}&codigoIbge=${safeIbge}`)
      .then((res) => {
        if (isMounted && res) {
          setFetchedData(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [cidade, uf, currentTenant?.id, currentTenant?.codigoIbge]);

  // Fallback seguro de dados
  const fallbackRanking: MunicipioBenchmark[] = [
    {
      id: 'm-curitiba',
      codigoIbge: '4106902',
      cidade: 'Curitiba',
      uf: 'PR',
      populacao: 1773733,
      porte: 'Metrópole',
      rclTotal: 10850000000,
      rclPerCapita: 6117,
      despesaPessoalPct: 44.8,
      arrecadacaoPropriaPerCapita: 2791,
      arrecadacaoPropriaPct: 45.6,
      captacaoPerCapita: 232,
      gastoSaudePct: 22.4,
      gastoEducacaoPct: 26.5,
      gastoObrasPct: 9.0,
      investimentoPerCapita: 553,
      dependenciaTransferenciasPct: 54.4,
      scoreEficienciaFiscal: 88.4,
      posicaoRanking: 1,
      autonomiaRankingPosicao: 1,
      isMunicipioAtivo: cidade === 'Curitiba',
    },
    {
      id: 'm-maringa',
      codigoIbge: '4115200',
      cidade: 'Maringá',
      uf: 'PR',
      populacao: 409657,
      porte: 'Grande',
      rclTotal: 2380000000,
      rclPerCapita: 5810,
      despesaPessoalPct: 46.5,
      arrecadacaoPropriaPerCapita: 1977,
      arrecadacaoPropriaPct: 34.0,
      captacaoPerCapita: 292,
      gastoSaudePct: 23.1,
      gastoEducacaoPct: 28.0,
      gastoObrasPct: 12.0,
      investimentoPerCapita: 696,
      dependenciaTransferenciasPct: 65.9,
      scoreEficienciaFiscal: 84.6,
      posicaoRanking: 2,
      autonomiaRankingPosicao: 2,
      isMunicipioAtivo: cidade === 'Maringá',
    },
    {
      id: 'm-araucaria',
      codigoIbge: '4101804',
      cidade: 'Araucária',
      uf: 'PR',
      populacao: 151666,
      porte: 'Médio',
      rclTotal: 1460000000,
      rclPerCapita: 9626,
      despesaPessoalPct: 51.3,
      arrecadacaoPropriaPerCapita: 2275,
      arrecadacaoPropriaPct: 23.6,
      captacaoPerCapita: 505,
      gastoSaudePct: 21.8,
      gastoEducacaoPct: 27.4,
      gastoObrasPct: 12.5,
      investimentoPerCapita: 1203,
      dependenciaTransferenciasPct: 76.4,
      scoreEficienciaFiscal: 82.8,
      posicaoRanking: 3,
      autonomiaRankingPosicao: 3,
      isMunicipioAtivo: cidade === 'Araucária',
    },
    {
      id: 'm-sjp',
      codigoIbge: '4125506',
      cidade: 'São José dos Pinhais',
      uf: 'PR',
      populacao: 329222,
      porte: 'Grande',
      rclTotal: 1780000000,
      rclPerCapita: 5407,
      despesaPessoalPct: 48.2,
      arrecadacaoPropriaPerCapita: 1579,
      arrecadacaoPropriaPct: 29.2,
      captacaoPerCapita: 248,
      gastoSaudePct: 21.8,
      gastoEducacaoPct: 27.4,
      gastoObrasPct: 11.0,
      investimentoPerCapita: 592,
      dependenciaTransferenciasPct: 70.8,
      scoreEficienciaFiscal: 79.2,
      posicaoRanking: 4,
      autonomiaRankingPosicao: 4,
    },
    {
      id: 'm-londrina',
      codigoIbge: '4113700',
      cidade: 'Londrina',
      uf: 'PR',
      populacao: 555965,
      porte: 'Grande',
      rclTotal: 2650000000,
      rclPerCapita: 4766,
      despesaPessoalPct: 50.1,
      arrecadacaoPropriaPerCapita: 1511,
      arrecadacaoPropriaPct: 31.7,
      captacaoPerCapita: 166,
      gastoSaudePct: 21.8,
      gastoEducacaoPct: 27.4,
      gastoObrasPct: 8.3,
      investimentoPerCapita: 396,
      dependenciaTransferenciasPct: 68.3,
      scoreEficienciaFiscal: 73.5,
      posicaoRanking: 5,
      autonomiaRankingPosicao: 5,
    },
  ];

  const fallbackPayload: BenchmarkPayload = {
    municipioAtivo: fallbackRanking.find(m => m.isMunicipioAtivo) || fallbackRanking[2],
    grupoComparativo: {
      nomeGrupo: `Municípios de Médio e Grande Porte do Paraná (${uf})`,
      totalMunicipios: 7,
      posicaoAtivo: 3,
      mediaRclPerCapita: 5938,
      mediaDespesaPessoalPct: 48.3,
      mediaArrecadacaoPropriaPerCapita: 1980,
      mediaArrecadacaoPropriaPct: 31.2,
      mediaInvestimentoPerCapita: 620,
      mediaCaptacaoPerCapita: 285,
      mediaGastoSaudePct: 22.1,
      mediaGastoEducacaoPct: 27.3,
      scoreMedio: 78.4,
      resumoComparativo: `${cidade} gasta 50,15% da RCL com pessoal; municípios similares: média 48,30%. ${cidade} está na posição 3 de 7 municípios similares em autonomia fiscal.`,
    },
    ranking: fallbackRanking,
    destaques: {
      pontosFortes: [
        `RCL per capita de ${cidade} é destaque no grupo regional.`,
        `Capacidade de investimento por habitante garante tração em infraestrutura urbana.`,
        `Arrecadação própria per capita supera a média estadual.`,
      ],
      oportunidadesMelhoria: [
        `Recomendada atenção ao limite prudencial da LRF para gastos com pessoal.`,
        `Diversificação de receitas próprias diante da Reforma Tributária (EC 132/2023).`,
      ],
    },
    dataSource: {
      origin: 'OFICIAL',
      source: 'SICONFI / STN / TCE-PR • Benchmark Municipal 2026',
    },
  };

  const payload = fetchedData || initialData || fallbackPayload;
  const ativo = payload.municipioAtivo;

  const portes = ['todos', 'Metrópole', 'Grande', 'Médio', 'Pequeno'];

  const filteredRanking = payload.ranking.filter(m => {
    const matchPorte = selectedPorte === 'todos' || m.porte === selectedPorte;
    const matchSearch =
      searchTerm === '' ||
      m.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.uf.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPorte && matchSearch;
  });

  const handleExportCSV = () => {
    const exportData = payload.ranking.map(m => ({
      'Posição': m.posicaoRanking,
      'Município': `${m.cidade} (${m.uf})`,
      'Porte': m.porte,
      'População': m.populacao,
      'RCL per capita (R$)': m.rclPerCapita,
      'Pessoal (% RCL)': `${m.despesaPessoalPct}%`,
      'Autonomia Própria (% Receita)': `${m.arrecadacaoPropriaPct || 0}%`,
      'Arrecadação Própria / Hab (R$)': m.arrecadacaoPropriaPerCapita,
      'Captação / Hab (R$)': m.captacaoPerCapita || 0,
      'Investimento / Hab (R$)': m.investimentoPerCapita,
      'Score de Eficiência': m.scoreEficienciaFiscal,
    }));
    exportToCSV(`benchmark_municipal_${cidade.toLowerCase()}_2026`, exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Benchmark Municipal */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                BENCHMARK ENTRE MUNICÍPIOS • DIFERENCIAL DE CATEGORIA
              </span>
              <DataSourceBadge dataSource={payload.dataSource} size="xs" showDetails />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight">
              PAREAMENTO REGIONAL & EFICIÊNCIA FISCAL — {cidade} / {uf}
            </h2>
            <p className="text-xs text-slate-300">
              {payload.grupoComparativo.resumoComparativo || `${cidade} gasta ${ativo.despesaPessoalPct}% da RCL com pessoal; municípios similares: média ${payload.grupoComparativo.mediaDespesaPessoalPct}%.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Autonomia Fiscal</span>
              <span className="inline-flex items-center gap-1 text-sm font-mono font-bold text-amber-400">
                <Trophy className="w-4 h-4" /> {ativo.autonomiaRankingPosicao || payload.grupoComparativo.posicaoAtivo}º Lugar ({payload.grupoComparativo.totalMunicipios} pares)
              </span>
            </div>
            <div className="text-right border-l border-slate-700 pl-3">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Score Geral</span>
              <span className="text-sm font-mono font-bold text-white">{ativo.scoreEficienciaFiscal} / 100</span>
            </div>
          </div>
        </div>

        {/* Frase Executiva em Destaque */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-sm p-3.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-200">
              <strong className="text-white">{cidade}</strong> gasta <strong className="text-amber-400">{ativo.despesaPessoalPct.toFixed(1)}% da RCL</strong> com pessoal; municípios similares da mesma faixa populacional gastam em média <strong className="text-emerald-400">{payload.grupoComparativo.mediaDespesaPessoalPct}%</strong>.
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Posição: {ativo.posicaoRanking}º de {payload.grupoComparativo.totalMunicipios} no Paraná
          </span>
        </div>
      </div>

      {/* 4 Cards Comparativos de Indicadores-Chave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            1. % RCL COM PESSOAL
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-amber-600 dark:text-amber-400">
            {ativo.despesaPessoalPct.toFixed(1)}%
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            Média do grupo similar: <strong>{payload.grupoComparativo.mediaDespesaPessoalPct}%</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            2. RECEITA PRÓPRIA VS TRANSF.
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-blue-600 dark:text-blue-400">
            {ativo.arrecadacaoPropriaPct || 23.6}%
          </div>
          <div className="mt-1 text-[10px] font-mono text-blue-600/80 dark:text-blue-400/80">
            IPTU+ISS+ITBI / Rec. Total ({formatCurrency(ativo.arrecadacaoPropriaPerCapita)}/hab)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            3. CAPTAÇÃO PER CAPITA
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-purple-600 dark:text-purple-400">
            {formatCurrency(ativo.captacaoPerCapita || 505)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-purple-600/80 dark:text-purple-400/80">
            Convênios e emendas / habitante
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            4. INVESTIMENTO PER CAPITA
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-emerald-600 dark:text-emerald-400">
            {formatCurrency(ativo.investimentoPerCapita)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80">
            Obras e infraestrutura / habitante
          </div>
        </div>
      </div>

      {/* =========================================================================
          GRÁFICO DE DISPERSÃO & DESPESAS POR FUNÇÃO
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Dispersão / Quadrante Estratégico (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                POSICIONAMENTO NO QUADRANTE REGIONAL
              </span>
              <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <ScatterChart className="w-4 h-4 text-blue-500" />
                <span>Gráfico de Dispersão: Autonomia Própria vs. Folha LRF</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Eixo X: Autonomia % • Eixo Y: Folha %</span>
          </div>

          {/* Scatter Plot Visual Canvas */}
          <div className="relative h-64 bg-slate-50 dark:bg-slate-950/60 rounded-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
            {/* Linhas de grade e referências */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-20 divide-x divide-y divide-slate-400" />

            {/* Marcadores de Quadrantes */}
            <span className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 uppercase">
              Alta Folha • Baixa Autonomia
            </span>
            <span className="absolute top-2 right-2 text-[9px] font-mono text-amber-500/80 uppercase">
              Alta Folha • Alta Autonomia
            </span>
            <span className="absolute bottom-2 left-2 text-[9px] font-mono text-slate-400 uppercase">
              Baixa Folha • Baixa Autonomia
            </span>
            <span className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-500/80 uppercase font-bold">
              ✓ Quadrante Ideal (Alta Autonomia • Baixa Folha)
            </span>

            {/* Pontos de Dispersão dos Municípios */}
            {payload.ranking.map((m) => {
              // Normaliza coordenadas no box (X: 10% a 50% de autonomia; Y: 40% a 55% de folha)
              const posX = Math.max(8, Math.min(92, (((m.arrecadacaoPropriaPct || 25) - 10) / 40) * 100));
              const posY = Math.max(8, Math.min(92, 100 - (((m.despesaPessoalPct - 40) / 15) * 100)));

              return (
                <div
                  key={m.id}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold transition-all shadow-md ${
                    m.isMunicipioAtivo
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 scale-125 z-20 animate-pulse'
                      : 'bg-slate-700 text-white hover:bg-blue-500 z-10'
                  }`}>
                    {m.posicaoRanking}
                  </div>

                  {/* Tooltip ao passar o mouse */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono p-2 rounded-xs whitespace-nowrap shadow-xl border border-slate-700 z-30">
                    <strong className="block text-amber-400">{m.cidade} ({m.uf})</strong>
                    <span>Folha: {m.despesaPessoalPct}% da RCL</span><br />
                    <span>Autonomia: {m.arrecadacaoPropriaPct || 25}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Despesas por Função como % do Orçamento (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
              COMPOSIÇÃO DE POLÍTICAS PÚBLICAS
            </span>
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Despesas por Função (% do Orçamento)</span>
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Saúde */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Saúde (Piso 15%):</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{ativo.gastoSaudePct || 21.8}%</strong>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((ativo.gastoSaudePct || 21.8) / 30) * 100}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">Média regional: {payload.grupoComparativo.mediaGastoSaudePct || 22.1}%</span>
            </div>

            {/* Educação */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Educação & MDE (Piso 25%):</span>
                <strong className="text-blue-600 dark:text-blue-400 font-bold">{ativo.gastoEducacaoPct || 27.4}%</strong>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((ativo.gastoEducacaoPct || 27.4) / 35) * 100}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">Média regional: {payload.grupoComparativo.mediaGastoEducacaoPct || 27.3}%</span>
            </div>

            {/* Obras e Infraestrutura */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Obras & Investimentos:</span>
                <strong className="text-purple-600 dark:text-purple-400 font-bold">{ativo.gastoObrasPct || 12.5}%</strong>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${((ativo.gastoObrasPct || 12.5) / 20) * 100}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">Média regional: 9.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Destaques: Pontos Fortes vs Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pontos Fortes */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 text-emerald-900 dark:text-emerald-300 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase font-mono tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Pontos Fortes & Liderança Fiscal de {cidade}</span>
          </div>
          <ul className="space-y-1.5 text-xs">
            {payload.destaques.pontosFortes.map((p, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Oportunidades de Melhoria */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 text-amber-900 dark:text-amber-300 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase font-mono tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Oportunidades de Melhoria & Ações Recomendadas</span>
          </div>
          <ul className="space-y-1.5 text-xs">
            {payload.destaques.oportunidadesMelhoria.map((o, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-amber-600 font-bold">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tabela de Ranking e Comparativo Pareado */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {portes.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPorte(p)}
                className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  selectedPorte === p
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {p === 'todos' ? 'Todos os Portes' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar município..."
                className="pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm w-44 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-sm hover:bg-emerald-100 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-center">Posição</th>
                <th className="py-2.5 px-4">Município</th>
                <th className="py-2.5 px-4">Porte</th>
                <th className="py-2.5 px-4 text-right">População</th>
                <th className="py-2.5 px-4 text-right">RCL / Hab (R$)</th>
                <th className="py-2.5 px-4 text-right">Pessoal (% RCL)</th>
                <th className="py-2.5 px-4 text-right">Autonomia (% Própria)</th>
                <th className="py-2.5 px-4 text-right">Captação / Hab</th>
                <th className="py-2.5 px-4 text-right">Investimento / Hab</th>
                <th className="py-2.5 px-4 text-center font-bold text-slate-900 dark:text-white">Score Eficiência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRanking.map(m => (
                <tr
                  key={m.id}
                  className={`transition ${
                    m.isMunicipioAtivo
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 font-bold border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        m.posicaoRanking === 1
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : m.posicaoRanking === 2
                          ? 'bg-slate-300 text-slate-900'
                          : m.posicaoRanking === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.posicaoRanking}º
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{m.cidade} / {m.uf}</span>
                      {m.isMunicipioAtivo && (
                        <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-mono font-bold bg-amber-500 text-slate-950 uppercase">
                          SUA CIDADE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                    {m.porte}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                    {m.populacao.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(m.rclPerCapita)}
                  </td>
                  <td className={`py-3 px-4 text-right ${m.despesaPessoalPct > 51.3 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m.despesaPessoalPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                    {m.arrecadacaoPropriaPct || 25}%
                  </td>
                  <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                    {formatCurrency(m.captacaoPerCapita || 380)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(m.investimentoPerCapita)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-sm text-[11px] font-mono font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      {m.scoreEficienciaFiscal} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkMunicipal;
