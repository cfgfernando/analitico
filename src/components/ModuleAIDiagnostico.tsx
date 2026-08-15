import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Send,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  Building,
  Scale,
  BrainCircuit,
  Copy,
  Check,
} from 'lucide-react';
import { getAIDiagnosis } from '../services/api';
import { FiscalKPIs } from '../types/fiscal';

interface ModuleAIDiagnosticoProps {
  summary: FiscalKPIs;
  ano: number;
}

export const ModuleAIDiagnostico: React.FC<ModuleAIDiagnosticoProps> = ({
  summary,
  ano,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const sampleQuestions = [
    'Quais medidas imediatas tomar para evitar atingir o Limite Prudencial da LRF (51,3%)?',
    'Como equilibrar o orçamento de R$ 1,70 bi diante da queda de ICMS e Royalties da REPAR?',
    'Qual a melhor estratégia para viabilizar os R$ 86,4 mi anuais do aporte FPMA?',
    'Como maximizar a captação dos R$ 124 milhões em emendas parlamentares e convênios?',
  ];

  const handleRunDiagnosis = async (customQ?: string) => {
    const q = customQ || question;
    setLoading(true);
    try {
      const res = await getAIDiagnosis(q, summary);
      setReport(res.analise);
      setProvider(res.provedor);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Inteligência Contábil & Auditoria Fiscal
              </span>
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Diagnóstico Estratégico para Tomada de Decisão
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Geração de pareceres técnicos executivos customizados para o Prefeito Municipal e o Secretário de Finanças de Araucária/PR com base nos dados reais do Siconfi e da LRF.
            </p>
          </div>

          <button
            onClick={() => handleRunDiagnosis()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-50 self-start md:self-center shrink-0"
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Processando Auditoria...' : 'Gerar Parecer Completo'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            TÓPICOS DE FOCO DA GESTÃO MUNICIPAL (CLIQUE PARA ANALISAR)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">GEMINI IA / SICONFI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleRunDiagnosis(sq);
              }}
              className="text-left p-3 rounded-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition flex items-center justify-between group"
            >
              <span>{sq}</span>
              <Send className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 shrink-0 ml-2 transition" />
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Digite uma pergunta específica sobre o cenário fiscal de Araucária..."
            className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleRunDiagnosis()}
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>
        </div>
      </div>

      {/* Report Box */}
      {(report || loading) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono">
                Parecer Técnico & Recomendações de Gestão Fiscal
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {provider && (
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-sm uppercase">
                  FONTE: {provider}
                </span>
              )}
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400 font-mono">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Consolidando parâmetros e elaborando diagnóstico contábil...</span>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {report}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
