import React, { useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { AlertasProativosPayload, AlertaPrazoCritico } from '../types/fiscal';
import { DataSourceBadge } from './DataSourceBadge';

interface AlertasPrazosCriticosProps {
  data?: AlertasProativosPayload | null;
  cidade?: string;
  uf?: string;
}

export const AlertasPrazosCriticos: React.FC<AlertasPrazosCriticosProps> = ({
  data: initialData,
  cidade = 'Araucária',
  uf = 'PR',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [reconhecidos, setReconhecidos] = useState<Record<string, boolean>>({});

  const fallbackAlertas: AlertaPrazoCritico[] = [
    {
      id: 'alt-cauc-cnd',
      categoria: 'CAUC',
      titulo: 'Renovação da Certidão Conjunta de Débitos Federais (CND / PGFN)',
      descricao: `A Certidão de Regularidade Fiscal da Prefeitura de ${cidade} junto à Receita Federal e PGFN expira nos próximos 18 dias.`,
      dataLimite: '2026-09-02',
      diasRestantes: 18,
      severidade: 'CRITICO',
      sancaoPrevista: 'Inadimplência imediata no CAUC e bloqueio de repasses de convênios federais e estaduais.',
      acaoRecomendada: 'Solicitar emissão de guia de regularização ou renovação automática no portal e-CAC da Receita Federal.',
      orgaoFiscalizador: 'Receita Federal / STN / CAUC',
      status: 'PENDENTE',
    },
    {
      id: 'alt-siconfi-rgf',
      categoria: 'SICONFI',
      titulo: 'Homologação e Publicação do RGF (2º Quadrimestre / 2026)',
      descricao: 'Prazo legal para transmissão e assinatura eletrônica do Relatório de Gestão Fiscal no SICONFI.',
      dataLimite: '2026-09-30',
      diasRestantes: 46,
      severidade: 'ALERTA',
      sancaoPrevista: 'Impedimento de contratação de operações de crédito e recebimento de transferências voluntárias (Art. 51 LRF).',
      acaoRecomendada: 'Revisar balancetes da contabilidade e fechar demonstrativo de despesa com pessoal com a folha.',
      orgaoFiscalizador: 'Secretaria do Tesouro Nacional (STN) / TCE',
      status: 'PENDENTE',
    },
    {
      id: 'alt-orcamento-loa',
      categoria: 'ORCAMENTO',
      titulo: 'Envio do Projeto da LOA 2027 à Câmara Municipal',
      descricao: 'Protocolização obrigatória do Projeto de Lei Orçamentária Anual para o exercício de 2027.',
      dataLimite: '2026-09-30',
      diasRestantes: 46,
      severidade: 'ALERTA',
      sancaoPrevista: 'Crime de responsabilidade do Chefe do Poder Executivo (Art. 35 ADCT).',
      acaoRecomendada: 'Consolidar audiências públicas e fechar estimativa de receitas com a reestimativa da Reforma Tributária.',
      orgaoFiscalizador: 'Câmara Municipal / Tribunal de Contas',
      status: 'PENDENTE',
    },
    {
      id: 'alt-lrf-folha',
      categoria: 'LRF_PESSOAL',
      titulo: 'Alerta Preventivo LRF: Despesa com Pessoal em 51,30% da RCL',
      descricao: 'Índice de folha atingiu o Limite Prudencial (51,30%). Vedações do Art. 22 parágrafo único da LRF ativadas.',
      dataLimite: '2026-12-31',
      diasRestantes: 138,
      severidade: 'CRITICO',
      sancaoPrevista: 'Proibição de concessão de vantagens, aumentos, criação de cargos e provimento de concurso público.',
      acaoRecomendada: 'Auditar gratificações extraordinárias e reavaliar contratos temporários.',
      orgaoFiscalizador: 'Tribunal de Contas do Estado / LRF',
      status: 'PENDENTE',
    },
    {
      id: 'alt-convenio-prestacao',
      categoria: 'CONVENIOS',
      titulo: 'Prestação de Contas Final de Convênio no Transferegov (MCid)',
      descricao: 'Finalização do prazo de 60 dias após a vigência para envio do relatório final de execução e notas fiscais.',
      dataLimite: '2026-09-10',
      diasRestantes: 26,
      severidade: 'ALERTA',
      sancaoPrevista: 'Instauração de Tomada de Contas Especial (TCE) e inclusão no CADIN.',
      acaoRecomendada: 'Solicitar ao engenheiro fiscal a emissão do Termo de Recebimento Definitivo da Obra e upload de fotos.',
      orgaoFiscalizador: 'Ministério das Cidades / Transferegov',
      status: 'PENDENTE',
    },
    {
      id: 'alt-fundeb-magisterio',
      categoria: 'FUNDEB',
      titulo: 'Acompanhamento do Piso de 70% do FUNDEB em Magistério',
      descricao: 'Verificação da aplicação de no mínimo 70% dos recursos do FUNDEB na remuneração dos profissionais da educação básica.',
      dataLimite: '2026-12-31',
      diasRestantes: 138,
      severidade: 'INFORMATIVO',
      sancaoPrevista: 'Devolução de recursos com juros e reprovação das contas anuais da Educação.',
      acaoRecomendada: 'Monitorar folha dos professores nos meses de outubro e novembro para programar eventual rateio ou abono legal.',
      orgaoFiscalizador: 'FNDE / SIOPE / CACS-FUNDEB',
      status: 'PENDENTE',
    },
  ];

  const payload: AlertasProativosPayload = initialData || {
    totalAlertas: fallbackAlertas.length,
    totalCriticos: fallbackAlertas.filter(a => a.severidade === 'CRITICO').length,
    totalAtencao: fallbackAlertas.filter(a => a.severidade === 'ALERTA').length,
    alertas: fallbackAlertas,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `SICONFI / CAUC / STN / TCE-${uf} • Radar de Prazos e Riscos 2026`,
    },
  };

  const categories = [
    { id: 'TODOS', label: 'Todos os Alertas' },
    { id: 'CAUC', label: 'Certidões CAUC' },
    { id: 'SICONFI', label: 'SICONFI / RREO / RGF' },
    { id: 'LRF_PESSOAL', label: 'LRF & Folha' },
    { id: 'ORCAMENTO', label: 'LOA / LDO' },
    { id: 'CONVENIOS', label: 'Transferegov' },
    { id: 'FUNDEB', label: 'FUNDEB & Educação' },
  ];

  const filteredAlertas = payload.alertas.filter(
    a => selectedCategory === 'TODOS' || a.categoria === selectedCategory
  );

  const toggleReconhecido = (id: string) => {
    setReconhecidos(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Alertas Proativos */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <BellRing className="w-3 h-3 text-rose-400 animate-pulse" />
              SISTEMA PROATIVO DE ALERTAS & PRAZOS CRÍTICOS
            </span>
            <DataSourceBadge dataSource={payload.dataSource} size="xs" showDetails />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            RADAR DE OBRIGAÇÕES LEGAIS, CERTIDÕES E RISCOS FISCAIS — {cidade} / {uf}
          </h2>
          <p className="text-xs text-slate-300">
            Monitoramento contínuo de vencimentos de certidões federais, prestação de contas de convênios e limites da LRF.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Riscos Críticos</span>
            <span className="inline-flex items-center gap-1 text-sm font-mono font-bold text-rose-400">
              <AlertOctagon className="w-4 h-4" /> {payload.totalCriticos} Críticos
            </span>
          </div>
          <div className="text-right border-l border-slate-700 pl-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Atenção</span>
            <span className="text-sm font-mono font-bold text-amber-400">{payload.totalAtencao} Prazos</span>
          </div>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-sm p-4 text-rose-900 dark:text-rose-300 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-500/20 rounded-full shrink-0">
            <AlertOctagon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 block">
              ALERTAS CRÍTICOS (URGENTE)
            </span>
            <div className="text-2xl font-bold font-mono tracking-tighter text-rose-950 dark:text-white">
              {payload.totalCriticos} Pendências
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-300">
              Ação imediata para evitar bloqueio de verbas
            </span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 text-amber-900 dark:text-amber-300 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
              PRAZOS EM ATENÇÃO (30 A 60 DIAS)
            </span>
            <div className="text-2xl font-bold font-mono tracking-tighter text-amber-950 dark:text-white">
              {payload.totalAtencao} Obrigações
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-300">
              SICONFI, LOA e Transferegov
            </span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 text-emerald-900 dark:text-emerald-300 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-full shrink-0">
            <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
              TOTAL DE OBRIGAÇÕES MONITORADAS
            </span>
            <div className="text-2xl font-bold font-mono tracking-tighter text-emerald-950 dark:text-white">
              {payload.totalAlertas} Monitoramentos
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
              Varredura ativa 24/7 no SICONFI e CAUC
            </span>
          </div>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-sm shadow-xs">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Lista de Cards de Alertas */}
      <div className="space-y-3">
        {filteredAlertas.map(alerta => {
          const isReconhecido = reconhecidos[alerta.id];
          const isCritico = alerta.severidade === 'CRITICO';
          const isAlerta = alerta.severidade === 'ALERTA';

          const cardBorder = isReconhecido
            ? 'border-slate-200 dark:border-slate-800 opacity-60'
            : isCritico
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10'
            : isAlerta
            ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

          return (
            <div
              key={alerta.id}
              className={`border rounded-sm p-4 shadow-sm transition space-y-3 ${cardBorder}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm border ${
                      isCritico
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        : isAlerta
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                    }`}
                  >
                    {alerta.severidade}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {alerta.categoria} • {alerta.orgaoFiscalizador}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Prazo Limite</span>
                    <span className={`text-xs font-mono font-bold ${isCritico ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {alerta.dataLimite} ({alerta.diasRestantes} dias)
                    </span>
                  </div>

                  <button
                    onClick={() => toggleReconhecido(alerta.id)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1 ${
                      isReconhecido
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isReconhecido ? <Check className="w-3 h-3" /> : null}
                    <span>{isReconhecido ? 'Ciente' : 'Marcar Ciente'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {alerta.titulo}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {alerta.descricao}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-sm p-2.5 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 uppercase block flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Sanção Legal em caso de Inadimplência
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {alerta.sancaoPrevista}
                  </p>
                </div>

                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-sm p-2.5 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase block flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Ação Imediata Recomendada
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {alerta.acaoRecomendada}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertasPrazosCriticos;
