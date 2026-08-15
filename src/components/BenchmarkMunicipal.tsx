import React, { useState } from 'react';
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
} from 'lucide-react';
import { BenchmarkPayload, MunicipioBenchmark } from '../types/fiscal';
import { formatCompactCurrency, formatCurrency, formatPercent, exportToCSV } from '../utils/formatters';
import { DataSourceBadge } from './DataSourceBadge';

interface BenchmarkMunicipalProps {
  data?: BenchmarkPayload | null;
  cidade?: string;
  uf?: string;
}

export const BenchmarkMunicipal: React.FC<BenchmarkMunicipalProps> = ({
  data: initialData,
  cidade = 'Araucária',
  uf = 'PR',
}) => {
  const [selectedPorte, setSelectedPorte] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
      investimentoPerCapita: 553,
      dependenciaTransferenciasPct: 54.4,
      scoreEficienciaFiscal: 88.4,
      posicaoRanking: 1,
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
      investimentoPerCapita: 696,
      dependenciaTransferenciasPct: 65.9,
      scoreEficienciaFiscal: 84.6,
      posicaoRanking: 2,
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
      investimentoPerCapita: 1203,
      dependenciaTransferenciasPct: 76.4,
      scoreEficienciaFiscal: 82.8,
      posicaoRanking: 3,
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
      investimentoPerCapita: 592,
      dependenciaTransferenciasPct: 70.8,
      scoreEficienciaFiscal: 79.2,
      posicaoRanking: 4,
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
      investimentoPerCapita: 396,
      dependenciaTransferenciasPct: 68.3,
      scoreEficienciaFiscal: 73.5,
      posicaoRanking: 5,
    },
  ];

  const payload: BenchmarkPayload = initialData || {
    municipioAtivo: fallbackRanking.find(m => m.isMunicipioAtivo) || fallbackRanking[2],
    grupoComparativo: {
      nomeGrupo: 'Mesorregiões & Polos Econômicos do Paraná',
      totalMunicipios: 7,
      posicaoAtivo: 3,
      mediaRclPerCapita: 5936,
      mediaDespesaPessoalPct: 48.3,
      mediaArrecadacaoPropriaPerCapita: 1980,
      mediaInvestimentoPerCapita: 620,
      scoreMedio: 78.4,
    },
    ranking: fallbackRanking,
    destaques: {
      pontosFortes: [
        `RCL per capita (R$ 9.626/hab) é a 1ª mais alta do grupo regional, 62% acima da média dos municípios comparados.`,
        `Capacidade de investimento por habitante (R$ 1.203/hab) é a maior entre os pares, garantindo tração em infraestrutura urbana.`,
        `Arrecadação própria per capita (R$ 2.275/hab) supera a média estadual devido à atividade industrial e de serviços.`,
      ],
      oportunidadesMelhoria: [
        `Despesa com pessoal está em 51,3% da RCL, acima da média do grupo (48,3%). Recomendada atenção ao limite prudencial da LRF.`,
        `Dependência de transferências estaduais do ICMS (76,4%) exige diversificação de base tributária própria com a Reforma Tributária.`,
      ],
    },
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: 'SICONFI / STN / TCE-PR • Benchmark Municipal 2026',
    },
  };

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
      'Arrecadação Própria / Hab (R$)': m.arrecadacaoPropriaPerCapita,
      'Investimento / Hab (R$)': m.investimentoPerCapita,
      'Score de Eficiência': m.scoreEficienciaFiscal,
    }));
    exportToCSV(`benchmark_municipal_${cidade.toLowerCase()}_2026`, exportData);
  };

  const ativo = payload.municipioAtivo;

  return (
    <div className="space-y-6">
      {/* Top Banner: Benchmark Municipal */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              BENCHMARK REGIONAL & EFICIÊNCIA FISCAL
            </span>
            <DataSourceBadge dataSource={payload.dataSource} size="xs" showDetails />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            COMPARATIVO MUNICIPAL & PAREAMENTO REGIONAL — {cidade} / {uf}
          </h2>
          <p className="text-xs text-slate-300">
            Comparação padronizada de indicadores per capita, folha de pagamento, arrecadação própria e capacidade de investimento.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Posição no Ranking</span>
            <span className="inline-flex items-center gap-1 text-sm font-mono font-bold text-amber-400">
              <Trophy className="w-4 h-4" /> {payload.grupoComparativo.posicaoAtivo}º Lugar
            </span>
          </div>
          <div className="text-right border-l border-slate-700 pl-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Score Geral</span>
            <span className="text-sm font-mono font-bold text-white">{ativo.scoreEficienciaFiscal} / 100</span>
          </div>
        </div>
      </div>

      {/* 4 Cards Comparativos de Indicadores-Chave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            1. RCL PER CAPITA
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
            {formatCurrency(ativo.rclPerCapita)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            +{((ativo.rclPerCapita / payload.grupoComparativo.mediaRclPerCapita) * 100 - 100).toFixed(0)}% vs Média Regional
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            2. PESSOAL (% RCL)
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-amber-600 dark:text-amber-400">
            {ativo.despesaPessoalPct.toFixed(1)}%
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            Média do grupo: {payload.grupoComparativo.mediaDespesaPessoalPct}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            3. ARRECADAÇÃO PRÓPRIA / HAB
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-blue-600 dark:text-blue-400">
            {formatCurrency(ativo.arrecadacaoPropriaPerCapita)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-blue-600/80 dark:text-blue-400/80">
            IPTU + ISS per capita
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            4. INVESTIMENTO / HAB
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-emerald-600 dark:text-emerald-400">
            {formatCurrency(ativo.investimentoPerCapita)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80">
            Obras e bens de capital
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
                <th className="py-2.5 px-4 text-right">Arrecadação Própria / Hab</th>
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
                  <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                    {formatCurrency(m.arrecadacaoPropriaPerCapita)}
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
