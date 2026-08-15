import React from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  Info,
  BookOpen,
  HelpCircle,
  Bell,
  Zap,
} from 'lucide-react';
import { LRFLimit, ToastMessage } from '../types/fiscal';
import { formatCurrency, formatPercent, formatCompactCurrency } from '../utils/formatters';
import { DataSourceBadge } from './DataSourceBadge';

interface Module4LRFProps {
  limites: LRFLimit[];
  ano: number;
  onTriggerToast?: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
}

export const Module4LRF: React.FC<Module4LRFProps> = ({ limites, ano, onTriggerToast }) => {
  const handleSimulatePrudencial = () => {
    if (!onTriggerToast) return;
    onTriggerToast({
      type: 'danger',
      title: 'LRF: Limite Prudencial Ultrapassado!',
      message: `[Simulação de Estresse] A Despesa Total com Pessoal atingiu 52,10% da RCL no exercício ${ano}, ultrapassando o Limite Prudencial da LRF (51,30%). Vedações do art. 22 ativadas: proibição de contratação de horas extras, reajustes remuneratórios e criação de novos cargos públicos.`,
      limitName: 'Despesa Total com Pessoal — Poder Executivo',
      metricValue: '52,10%',
      threshold: 'Prudencial: 51,30% | Legal: 54,00%',
      ano: ano,
      actionLabel: 'Ver Limites LRF',
      actionTabId: 'modulo4',
      duration: 10000,
    });
  };

  const handleSimulateDivida = () => {
    if (!onTriggerToast) return;
    onTriggerToast({
      type: 'warning',
      title: 'LRF: Limite de Alerta de Dívida Atingido',
      message: `[Simulação de Estresse] A Dívida Consolidada Líquida atingiu 109,20% da RCL, ultrapassando o Limite de Alerta do Senado Federal (108,00%). Recomendada suspensão de novas operações de crédito.`,
      limitName: 'Dívida Consolidada Líquida (DCL)',
      metricValue: '109,20%',
      threshold: 'Alerta: 108,00% | Legal: 120,00%',
      ano: ano,
      actionLabel: 'Ver Limites LRF',
      actionTabId: 'modulo4',
      duration: 9000,
    });
  };

  const handleSimulateLegal = () => {
    if (!onTriggerToast) return;
    onTriggerToast({
      type: 'danger',
      title: 'LRF: Limite Legal Ultrapassado!',
      message: `[Simulação de Estresse] A Despesa Total com Pessoal atingiu 54,80% da RCL no exercício ${ano}, ultrapassando o Teto Legal Máximo de 54,00%. Município sujeito ao bloqueio de transferências voluntárias da União e sanções institucionais do TCE-PR.`,
      limitName: 'Despesa Total com Pessoal — Poder Executivo',
      metricValue: '54,80%',
      threshold: 'Teto Legal: 54,00%',
      ano: ano,
      actionLabel: 'Ver Limites LRF',
      actionTabId: 'modulo4',
      duration: 11000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Painel de Conformidade dos Limites da Lei de Responsabilidade Fiscal (LRF)
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Monitoramento automatizado segundo a LC 101/2000, Constituição Federal e Instruções Normativas do TCE-PR.
              Semáforos calibrados para prever riscos e emitir notificações toast automáticas ao detectar aproximação ou estouro dos limites prudenciais.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DataSourceBadge size="sm" showDetails />
            <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              RELATÓRIO RGF / SICONFI
            </span>
          </div>
        </div>

        {/* Simulation / Testing bar for Toast Notifications */}
        {onTriggerToast && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Simulação de Notificações Toast LRF:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                id="btn-test-toast-prudencial"
                onClick={handleSimulatePrudencial}
                className="px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition flex items-center gap-1"
                title="Testar disparo de toast quando Despesa com Pessoal ultrapassa o Limite Prudencial (51,30%)"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Simular Pessoal &gt; 51,3% (Prudencial)</span>
              </button>
              <button
                type="button"
                id="btn-test-toast-divida"
                onClick={handleSimulateDivida}
                className="px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 transition flex items-center gap-1"
                title="Testar disparo de toast quando Dívida Consolidada atinge o Limite de Alerta (108%)"
              >
                <Zap className="w-3 h-3 text-blue-500" />
                <span>Simular Dívida &gt; 108% (Alerta)</span>
              </button>
              <button
                type="button"
                id="btn-test-toast-legal"
                onClick={handleSimulateLegal}
                className="px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
                title="Testar disparo de toast quando limite legal máximo é violado"
              >
                <Zap className="w-3 h-3 text-rose-500" />
                <span>Simular Pessoal &gt; 54% (Legal)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LRF Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Array.isArray(limites) ? limites : ((limites as any)?.limites || [])).map(item => {
          const isAtencao = item.status === 'ATENCAO';
          const isCritico = item.status === 'CRITICO';
          const isOk = item.status === 'OK';

          const borderClass = isCritico
            ? 'border-rose-300 dark:border-rose-800'
            : isAtencao
            ? 'border-amber-300 dark:border-amber-800'
            : 'border-emerald-300 dark:border-emerald-800';

          const badgeClass = isCritico
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            : isAtencao
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';

          const Icon = isCritico ? XCircle : isAtencao ? AlertTriangle : CheckCircle2;

          return (
            <div
              key={item.id}
              id={`lrf-card-${item.id}`}
              className={`border rounded-sm p-4 shadow-sm flex flex-col justify-between transition ${borderClass} bg-white dark:bg-slate-900`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                      {item.baseCalculoNome}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {item.nome}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${badgeClass}`}>
                    <Icon className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>

                {/* Values & Progress Visual */}
                <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-sm border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500 uppercase font-mono">Realizado / Aplicado:</span>
                    <div className="text-right">
                      <span className="text-lg font-bold font-mono tracking-tighter text-slate-900 dark:text-white">
                        {formatPercent(item.percentualRealizado)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ({formatCurrency(item.valorRealizado)})
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div
                      className={`h-full ${
                        isCritico ? 'bg-rose-500' : isAtencao ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (item.percentualRealizado / (item.limiteLegal * 1.2 || 100)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Legal Benchmarks */}
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                    {item.limiteAlerta && (
                      <span className="text-amber-600 dark:text-amber-400">Alerta: {item.limiteAlerta}%</span>
                    )}
                    {item.limitePrudencial && (
                      <span className="text-orange-600 dark:text-orange-400">Prudencial: {item.limitePrudencial}%</span>
                    )}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {item.limiteMinimoOuMaximo === 'minimo' ? 'Piso Mínimo' : 'Teto Legal'}: {item.limiteLegal}%
                    </span>
                  </div>
                </div>

                {/* Legal foundation & audit note */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" />
                    <span>Fundamento: {item.fundamentoLegal}</span>
                  </div>
                  <p className="text-xs leading-relaxed bg-slate-50/60 dark:bg-slate-800/30 p-2 rounded-sm border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                    {item.observacao}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 uppercase">Base de Cálculo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(item.baseCalculoValor)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
