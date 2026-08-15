import React, { useState } from 'react';
import {
  ShieldAlert,
  Wallet,
  Users,
  Target,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { formatCompactCurrency, formatCurrency, formatPercent } from '../utils/formatters';
import { DataSourceBadge } from './DataSourceBadge';

interface DecisaoUrgente {
  id: string;
  prioridade: string;
  categoria: string;
  titulo: string;
  descricao: string;
  impactoFinanceiro: string;
  acaoSugerida: string;
  prazoDias: number;
}

interface PainelDoPrefeitoProps {
  data?: {
    ano: number;
    municipio: {
      nome: string;
      cidade: string;
      uf: string;
      codigoIbge: string;
    };
    semaforo: {
      status: 'VERDE' | 'AMARELO' | 'VERMELHO';
      motivo: string;
    };
    caixaDisponivel: {
      total: number;
      recursosLivres: number;
      recursosVinculados: number;
    };
    margemFolha: {
      gastoAtual: number;
      percentualRCL: number;
      limiteAlertaValor: number;
      limitePrudencialValor: number;
      limiteLegalValor: number;
      margemAtePrudencialReais: number;
      margemAteLegalReais: number;
      status: string;
    };
    captacao: {
      metaAnual: number;
      realizado: number;
      percentual: number;
    };
    decisoesUrgentes: DecisaoUrgente[];
    dataSource?: any;
  } | null;
  ano: number;
  onNavigateToTab?: (tabId: string) => void;
}

export const PainelDoPrefeito: React.FC<PainelDoPrefeitoProps> = ({
  data,
  ano,
  onNavigateToTab,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fallback seguro de dados
  const panelData = data || {
    ano,
    municipio: {
      nome: 'Prefeitura Municipal de Araucária',
      cidade: 'Araucária',
      uf: 'PR',
      codigoIbge: '4101804',
    },
    semaforo: {
      status: 'AMARELO' as const,
      motivo: 'Folha de pessoal atingiu 51,3% da RCL. Atenção ao limite prudencial.',
    },
    caixaDisponivel: {
      total: 215000000,
      recursosLivres: 81700000,
      recursosVinculados: 133300000,
    },
    margemFolha: {
      gastoAtual: 749000000,
      percentualRCL: 51.3,
      limiteAlertaValor: 709560000,
      limitePrudencialValor: 748980000,
      limiteLegalValor: 788400000,
      margemAtePrudencialReais: -20000,
      margemAteLegalReais: 39400000,
      status: 'PRUDENCIAL',
    },
    captacao: {
      metaAnual: 124000000,
      realizado: 78400000,
      percentual: 63.2,
    },
    decisoesUrgentes: [
      {
        id: 'dec-1',
        prioridade: 'ALTA',
        categoria: 'FOLHA DE PESSOAL',
        titulo: 'Decreto de Contingenciamento de Horas Extras e Gratificações',
        descricao: 'Folha encostou no limite prudencial (51,3%). Necessário conter novas concessões.',
        impactoFinanceiro: 'R$ 14.5M/ano',
        acaoSugerida: 'Publicar Decreto Municipal restringindo horas extras nas secretarias.',
        prazoDias: 5,
      },
      {
        id: 'dec-2',
        prioridade: 'ALTA',
        categoria: 'RECEITAS & ICMS',
        titulo: 'Ação de Defesa do Índice de Participação dos Municípios (IPM)',
        descricao: 'Queda de 12% na cota-parte estadual. Auditoria contábil pronta para envio.',
        impactoFinanceiro: 'R$ 38.0M',
        acaoSugerida: 'Determinar à PGM ajuizamento de recurso administrativo no Estado.',
        prazoDias: 7,
      },
      {
        id: 'dec-3',
        prioridade: 'MEDIA',
        categoria: 'CONVÊNIOS & OBRAS',
        titulo: 'Aprovação de Projetos de Engenharia no Transferegov',
        descricao: 'R$ 27M em emendas federais aguardando aceite de projeto executivo.',
        impactoFinanceiro: 'R$ 27.2M',
        acaoSugerida: 'Reunião de alinhamento com a Caixa Econômica e Secretaria de Obras.',
        prazoDias: 10,
      },
    ],
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: 'Painel Executivo Municipal',
    },
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const semaforoColors = {
    VERDE: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-500 text-white',
      dot: 'bg-emerald-500',
      title: 'SITUAÇÃO FISCAL REGULAR',
    },
    AMARELO: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-500 text-slate-900 font-bold',
      dot: 'bg-amber-500',
      title: 'ATENÇÃO: LIMITE DE ALERTA ATIVADO',
    },
    VERMELHO: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      badge: 'bg-rose-600 text-white font-bold',
      dot: 'bg-rose-600',
      title: 'RISCO CRÍTICO: LIMITE PRUDENCIAL / DEFICIT',
    },
  };

  const currentSemaforo = semaforoColors[panelData.semaforo.status] || semaforoColors.AMARELO;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 min-h-screen' : ''}`}>
      {/* Top Action Bar: Modo Apresentação & Impressão */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              VISÃO EXECUTIVA — GABINETE DO PREFEITO
            </span>
            <DataSourceBadge dataSource={panelData.dataSource} size="xs" showDetails />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            PAINEL DO PREFEITO — {panelData.municipio.cidade} / {panelData.municipio.uf}
          </h2>
          <p className="text-xs text-slate-300">
            Resumo gerencial com indicadores-chave, margem real em R$ e ações urgentes da semana.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-sm transition cursor-pointer"
            title="Alternar Modo Apresentação em Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Sair da Apresentação' : 'Modo Apresentação'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm transition cursor-pointer shadow-sm"
            title="Imprimir Relatório Executivo do Prefeito"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 5 Cards de Impacto Imediato */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Semáforo Fiscal */}
        <div className={`rounded-sm p-4 border shadow-sm flex flex-col justify-between ${currentSemaforo.bg}`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                1. SEMÁFORO FISCAL
              </span>
              <span className={`w-3 h-3 rounded-full ${currentSemaforo.dot} animate-pulse`}></span>
            </div>
            <div className="text-base font-bold uppercase tracking-tight mb-1">
              {currentSemaforo.title}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {panelData.semaforo.motivo}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-mono font-bold">
            STATUS GERAL: {panelData.semaforo.status}
          </div>
        </div>

        {/* Card 2: Caixa Disponível Real */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                2. CAIXA DISPONÍVEL
              </span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
              {formatCompactCurrency(panelData.caixaDisponivel.total)}
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-mono">
                <span>Recursos Livres:</span>
                <strong>{formatCompactCurrency(panelData.caixaDisponivel.recursosLivres)}</strong>
              </div>
              <div className="flex justify-between text-slate-500 font-mono">
                <span>Vinculados (Saúde/Educ):</span>
                <span>{formatCompactCurrency(panelData.caixaDisponivel.recursosVinculados)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400">
            Disponibilidade imediata para investimentos
          </div>
        </div>

        {/* Card 3: Margem da Folha em R$ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                3. MARGEM DA FOLHA (LRF)
              </span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
                {panelData.margemFolha.percentualRCL.toFixed(2)}%
              </span>
              <span className="text-xs font-mono text-slate-400">da RCL</span>
            </div>
            <div className="mt-2 text-xs font-mono">
              {panelData.margemFolha.margemAtePrudencialReais >= 0 ? (
                <div className="text-emerald-600 dark:text-emerald-400">
                  Folga até Prudencial:{' '}
                  <strong>+{formatCompactCurrency(panelData.margemFolha.margemAtePrudencialReais)}</strong>
                </div>
              ) : (
                <div className="text-rose-600 dark:text-rose-400">
                  Excesso do Prudencial:{' '}
                  <strong>{formatCompactCurrency(panelData.margemFolha.margemAtePrudencialReais)}</strong>
                </div>
              )}
              <div className="text-slate-500 text-[11px] mt-0.5">
                Teto Legal (54%): {formatCompactCurrency(panelData.margemFolha.limiteLegalValor)}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400">
            Art. 22 LRF • Poder Executivo
          </div>
        </div>

        {/* Card 4: Meta de Captação */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                4. CAPTAÇÃO & CONVÊNIOS
              </span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tighter text-blue-600 dark:text-blue-400">
              {panelData.captacao.percentual}%
            </div>
            <div className="mt-2 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Captado:</span>
                <strong>{formatCompactCurrency(panelData.captacao.realizado)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meta Anual:</span>
                <span>{formatCompactCurrency(panelData.captacao.metaAnual)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400">
            Transferegov + Emendas Parlamentares
          </div>
        </div>
      </div>

      {/* Card 5: Top 3 Decisões Urgentes da Semana */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              5. TOP 3 DECISÕES URGENTES DA SEMANA (PAUTA DO GABINETE)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
            Prioridade Estratégica
          </span>
        </div>

        <div className="p-5 space-y-4">
          {panelData.decisoesUrgentes.map((dec, idx) => (
            <div
              key={dec.id}
              className="border border-slate-200 dark:border-slate-800 rounded-sm p-4 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    DECISÃO #{idx + 1}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase ${
                      dec.prioridade === 'ALTA'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    PRIORIDADE {dec.prioridade}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    • {dec.categoria}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dec.titulo}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {dec.descricao}
                </p>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                  💡 Ação Recomendada: {dec.acaoSugerida}
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Impacto Financeiro</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {dec.impactoFinanceiro}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Prazo: {dec.prazoDias} dias</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PainelDoPrefeito;
