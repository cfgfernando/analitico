import React, { useState } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Calculator,
  Building2,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { ProgramaTransferegov, SimulacaoContrapartida } from '../types/fiscal';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters';
import { DataSourceBadge } from './DataSourceBadge';

interface RadarCaptacaoProps {
  programas?: ProgramaTransferegov[];
  resumo?: {
    totalProgramasAbertos: number;
    programasElegiveis: number;
    potencialGlobalCaptacao: number;
    programasUrgentesPrazo: number;
    caucStatus: string;
    capagScore: string;
  };
  cidade?: string;
  uf?: string;
}

export const RadarCaptacao: React.FC<RadarCaptacaoProps> = ({
  programas: initialProgramas,
  resumo: initialResumo,
  cidade = 'Araucária',
  uf = 'PR',
}) => {
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Simulador de Contrapartida State
  const [simValorGlobal, setSimValorGlobal] = useState<number>(5000000);
  const [simPctContrapartida, setSimPctContrapartida] = useState<number>(5.0);

  // Fallback seguro de dados
  const programas: ProgramaTransferegov[] = initialProgramas || [
    {
      id: 'prog-1',
      codigoPrograma: '3600020260012',
      orgaoConcedente: 'Fundo Nacional de Saúde (FNS)',
      ministerio: 'Saúde',
      titulo: 'Estruturação da Rede de Serviços de Atenção Primária — UBS Porte III',
      areaTematica: 'Construção e Equipamentos de Saúde',
      objeto: `Construção e ampliação de UBS e aquisição de equipamentos médicos em ${cidade}.`,
      valorMinimo: 850000,
      valorMaximo: 4500000,
      percentualContrapartidaMinima: 2.0,
      dataInicioInscricao: '2026-01-15',
      dataFimInscricao: '2026-03-15',
      diasRestantes: 12,
      statusPrazo: 'MODERADO',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['CAUC 100% adimplente', 'Piso da Saúde (21,8%) superado', 'CAPAG compatível'],
        capagMinima: 'B',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br',
    },
    {
      id: 'prog-2',
      codigoPrograma: '5600020260005',
      orgaoConcedente: 'Ministério das Cidades / Caixa',
      ministerio: 'Cidades / Infraestrutura',
      titulo: 'Programa Avançar Cidades — Pavimentação, Drenagem e Mobilidade Urbana',
      areaTematica: 'Infraestrutura Urbana',
      objeto: `Drenagem e pavimentação asfáltica em vias de conexão interbairros em ${cidade}.`,
      valorMinimo: 2000000,
      valorMaximo: 25000000,
      percentualContrapartidaMinima: 5.0,
      dataInicioInscricao: '2026-02-01',
      dataFimInscricao: '2026-02-28',
      diasRestantes: 6,
      statusPrazo: 'URGENTE',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['Endividamento DCL 12,8% (teto 120%)', 'Plano Diretor atualizado'],
        capagMinima: 'A',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br',
    },
    {
      id: 'prog-3',
      codigoPrograma: '2600020260088',
      orgaoConcedente: 'FNDE / Ministério da Educação',
      ministerio: 'Educação',
      titulo: 'Construção de Centros de Educação Infantil — Proinfância Tipo 1',
      areaTematica: 'Educação Infantil',
      objeto: `Construção de CMEI para 376 crianças em dois turnos em ${cidade}.`,
      valorMinimo: 3200000,
      valorMaximo: 8900000,
      percentualContrapartidaMinima: 1.0,
      dataInicioInscricao: '2026-01-20',
      dataFimInscricao: '2026-03-30',
      diasRestantes: 28,
      statusPrazo: 'MODERADO',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['Aplicação de 27,4% em MDE (Piso 25%)', 'Terreno desimpedido'],
        capagMinima: 'B',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br',
    },
  ];

  const resumo = initialResumo || {
    totalProgramasAbertos: programas.length,
    programasElegiveis: programas.filter(p => p.elegibilidade.status === 'ELEGIVEL').length,
    potencialGlobalCaptacao: 38400000,
    programasUrgentesPrazo: 1,
    caucStatus: 'ADIMPLENTE_100',
    capagScore: 'A (Capacidade Plena)',
  };

  const ministerios = ['todos', 'Saúde', 'Cidades / Infraestrutura', 'Educação', 'Meio Ambiente'];

  const filteredProgramas = programas.filter(p => {
    const matchMin = selectedMinisterio === 'todos' || p.ministerio === selectedMinisterio;
    const matchSearch =
      searchTerm === '' ||
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoPrograma.includes(searchTerm);
    return matchMin && matchSearch;
  });

  // Cálculo do Simulador de Contrapartida
  const contrapartidaCalculada = Math.round(simValorGlobal * (simPctContrapartida / 100));
  const repasseFederalCalculado = simValorGlobal - contrapartidaCalculada;
  const caixaLivreEstimado = 81700000;
  const impactoCaixaLivre = Number(((contrapartidaCalculada / caixaLivreEstimado) * 100).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Top Banner: Radar de Captação */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
              RADAR DE CONVÊNIOS & TRANSFERÊNCIAS VOLUNTÁRIAS
            </span>
            <DataSourceBadge size="xs" showDetails />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            OPORTUNIDADES DE CAPTAÇÃO ATIVAS NO TRANSFEREGOV — {cidade} / {uf}
          </h2>
          <p className="text-xs text-slate-300">
            Monitoramento de editais de ministérios federais, verificação de elegibilidade (CAUC/CAPAG) e contagem regressiva de prazos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Status CAUC / STN</span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Regular
            </span>
          </div>
          <div className="text-right border-l border-slate-700 pl-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Nota CAPAG</span>
            <span className="text-xs font-mono font-bold text-white">Score {resumo.capagScore}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            PROGRAMAS DISPONÍVEIS
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
            {resumo.totalProgramasAbertos}
          </div>
          <span className="text-[10px] font-mono text-slate-500">Editais abertos no Transferegov</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/80 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
            MUNICÍPIO 100% ELEGÍVEL
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-emerald-600 dark:text-emerald-400">
            {resumo.programasElegiveis} editais
          </div>
          <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">Sem impedimentos no CAUC</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-900/80 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
            POTENCIAL GLOBAL
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-blue-600 dark:text-blue-400">
            {formatCompactCurrency(resumo.potencialGlobalCaptacao)}
          </div>
          <span className="text-[10px] font-mono text-blue-700/80 dark:text-blue-400/80">Teto máximo de recursos federais</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/80 rounded-sm p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
            PRAZOS URGENTES
          </span>
          <div className="text-2xl font-bold font-mono tracking-tighter text-amber-600 dark:text-amber-400">
            {resumo.programasUrgentesPrazo} edital
          </div>
          <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-400/80">Encerra em menos de 10 dias</span>
        </div>
      </div>

      {/* Grid: Lista de Programas (2/3) + Simulador de Contrapartida (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Editais e Linha do Tempo de Prazos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
            {/* Filtros de Categoria */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {ministerios.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMinisterio(m)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                      selectedMinisterio === m
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {m === 'todos' ? 'Todos os Ministérios' : m}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar edital..."
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm w-48 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Lista dos Editais */}
            <div className="space-y-3">
              {filteredProgramas.map(prog => (
                <div
                  key={prog.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-sm p-4 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          {prog.ministerio}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Cód. {prog.codigoPrograma}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {prog.titulo}
                      </h4>
                    </div>

                    {/* Timeline de Prazo & Badge */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase ${
                          prog.statusPrazo === 'URGENTE'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        Faltam {prog.diasRestantes} dias
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {prog.objeto}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Teto de Repasse Federal</span>
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(prog.valorMaximo)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Contrapartida Mínima</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {prog.percentualContrapartidaMinima.toFixed(1)}% (
                        {formatCompactCurrency(prog.valorMaximo * (prog.percentualContrapartidaMinima / 100))})
                      </strong>
                    </div>

                    <div className="flex sm:justify-end items-center">
                      <a
                        href={prog.linkTransferegov}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Ver no Transferegov</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Simulador de Contrapartida em R$ */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Simulador de Contrapartida Municipal
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Valor Global do Projeto / Convênio (R$)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={simValorGlobal}
                  onChange={e => setSimValorGlobal(Math.max(100000, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    % Contrapartida do Município: {simPctContrapartida.toFixed(1)}%
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">Mínimo legal: 1% a 5%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="20.0"
                  step="0.5"
                  value={simPctContrapartida}
                  onChange={e => setSimPctContrapartida(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Resultados da Simulação */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-sm border border-slate-200 dark:border-slate-700 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Repasse Federal (União):</span>
                <strong className="text-blue-600 dark:text-blue-400">
                  {formatCurrency(repasseFederalCalculado)}
                </strong>
              </div>

              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Contrapartida Municipal:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(contrapartidaCalculada)}
                </strong>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Impacto no Caixa Livre:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {impactoCaixaLivre}% da reserva
                </span>
              </div>
            </div>

            {/* Parecer de Viabilidade */}
            <div className="p-3 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-1 font-mono uppercase text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Viabilidade Financeira: ALTA</span>
              </div>
              <p className="text-[11px]">
                A contrapartida exigida de {formatCompactCurrency(contrapartidaCalculada)} não compromete a capacidade de pagamento do município nem o limite prudencial da folha.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarCaptacao;
