import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Code2,
  FileText,
  Building2,
  Sparkles,
  QrCode,
  Lock,
} from 'lucide-react';
import { SeloConformidadePayload, CriterioConformidade } from '../types/fiscal';
import { DataSourceBadge } from './DataSourceBadge';

interface SeloConformidadeProps {
  data?: SeloConformidadePayload | null;
  cidade?: string;
  uf?: string;
  ano?: number;
}

export const SeloConformidade: React.FC<SeloConformidadeProps> = ({
  data: initialData,
  cidade = 'Araucária',
  uf = 'PR',
  ano = 2026,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Fallback seguro de dados
  const fallbackCriterios: CriterioConformidade[] = [
    {
      id: 'crit-1',
      nome: 'Limite Legal de Despesa com Pessoal (LRF)',
      exigenciaLegal: 'Máximo 54,00% da RCL (Executivo)',
      valorObtido: '51,30% da RCL (Prudencial)',
      status: 'CUMPRIDO',
      pontuacao: 20,
      peso: 20,
      fundamentoLegal: 'Art. 19 e 20 da LRF (LC 101/2000)',
    },
    {
      id: 'crit-2',
      nome: 'Piso Constitucional da Educação (MDE)',
      exigenciaLegal: 'Mínimo 25,00% das receitas de impostos',
      valorObtido: '27,40% aplicado',
      status: 'CUMPRIDO',
      pontuacao: 20,
      peso: 20,
      fundamentoLegal: 'Art. 212 da Constituição Federal',
    },
    {
      id: 'crit-3',
      nome: 'Piso Constitucional da Saúde (ASPS)',
      exigenciaLegal: 'Mínimo 15,00% das receitas de impostos',
      valorObtido: '21,80% aplicado',
      status: 'CUMPRIDO',
      pontuacao: 20,
      peso: 20,
      fundamentoLegal: 'LC 141/2012 e Art. 198 da CF/88',
    },
    {
      id: 'crit-4',
      nome: 'Regularidade Fiscal e Previdenciária (CAUC)',
      exigenciaLegal: '100% dos itens adimplentes no SIAFI/STN',
      valorObtido: 'Adimplente em todas as 16 exigências',
      status: 'CUMPRIDO',
      pontuacao: 15,
      peso: 15,
      fundamentoLegal: 'Portaria STN nº 1.444/2021',
    },
    {
      id: 'crit-5',
      nome: 'Endividamento e Dívida Consolidada Líquida (DCL)',
      exigenciaLegal: 'Máximo 120,00% da RCL',
      valorObtido: '12,80% da RCL (Excelente)',
      status: 'CUMPRIDO',
      pontuacao: 15,
      peso: 15,
      fundamentoLegal: 'Resolução do Senado Federal nº 40/2001',
    },
    {
      id: 'crit-6',
      nome: 'Transparência Fiscal e Envio Tempestivo ao SICONFI',
      exigenciaLegal: 'Homologação RREO bimestral e RGF quadrimestral',
      valorObtido: 'Demonstrativos homologados no prazo',
      status: 'CUMPRIDO',
      pontuacao: 10,
      peso: 10,
      fundamentoLegal: 'Art. 48 da LRF e Portaria STN nº 642/2019',
    },
  ];

  const payload: SeloConformidadePayload = initialData || {
    municipio: {
      nome: `Prefeitura Municipal de ${cidade}`,
      cidade,
      uf,
      codigoIbge: '4101804',
      prefeitoAtual: `Gabinete do Prefeito Municipal de ${cidade}`,
    },
    ano,
    nivelSelo: 'OURO',
    pontuacaoTotal: 85,
    dataEmissao: '2026-08-15',
    codigoAutenticidade: `CERT-4101804-${ano}-85PTS-A7F9E2`,
    criterios: fallbackCriterios,
    parecerConclusivo: `Certificamos que o Município de ${cidade} (${uf}) atingiu 85 de 100 pontos possíveis na auditoria de conformidade fiscal e constitucional do exercício de ${ano}, fazendo jus ao SELO OURO DE GESTÃO FISCAL TRANSPARENTE. O município cumpre com rigor os pisos da Saúde (21,80%) e Educação (27,40%), mantém a regularidade integral no CAUC e observa os limites da Lei de Responsabilidade Fiscal.`,
    embedWidgetHtml: `<div id="selo-fiscal-4101804" data-tenant="4101804" data-ano="${ano}" style="font-family:sans-serif;border:1px solid #10b981;border-radius:4px;padding:12px;display:inline-flex;align-items:center;gap:10px;background:#f0fdf4"><img src="https://analitico.escrita.online/assets/selo-ouro.svg" alt="Selo Fiscal Ouro" width="40" height="40"/><div><strong style="display:block;font-size:12px;color:#065f46">SELO OURO DE CONFORMIDADE FISCAL</strong><span style="font-size:10px;color:#047857">Prefeitura de ${cidade} • Score 85/100 • Exercício ${ano}</span></div></div>`,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `Auditoria de Conformidade Constitucional e LRF / TCE-${uf} / SICONFI`,
    },
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(payload.embedWidgetHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const seloColors = {
    DIAMANTE: {
      border: 'border-cyan-400',
      badge: 'bg-cyan-500 text-slate-950',
      gradient: 'from-cyan-900/30 via-slate-900 to-slate-950',
      iconColor: 'text-cyan-400',
    },
    OURO: {
      border: 'border-amber-400',
      badge: 'bg-amber-400 text-slate-950',
      gradient: 'from-amber-950/40 via-slate-900 to-slate-950',
      iconColor: 'text-amber-400',
    },
    PRATA: {
      border: 'border-slate-400',
      badge: 'bg-slate-300 text-slate-950',
      gradient: 'from-slate-800/40 via-slate-900 to-slate-950',
      iconColor: 'text-slate-300',
    },
    BRONZE: {
      border: 'border-amber-700',
      badge: 'bg-amber-700 text-white',
      gradient: 'from-amber-950/20 via-slate-900 to-slate-950',
      iconColor: 'text-amber-600',
    },
    IRREGULAR: {
      border: 'border-rose-500',
      badge: 'bg-rose-600 text-white',
      gradient: 'from-rose-950/30 via-slate-900 to-slate-950',
      iconColor: 'text-rose-500',
    },
  };

  const currentStyle = seloColors[payload.nivelSelo] || seloColors.OURO;

  return (
    <div className="space-y-6">
      {/* Top Banner: Selo de Conformidade */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Award className="w-3 h-3" />
              SELO OFICIAL DE GESTÃO FISCAL TRANSPARENTE
            </span>
            <DataSourceBadge dataSource={payload.dataSource} size="xs" showDetails />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            CERTIFICAÇÃO DE REGULARIDADE FISCAL E CONSTITUCIONAL — {payload.municipio.cidade} / {payload.municipio.uf}
          </h2>
          <p className="text-xs text-slate-300">
            Auditoria dos 6 pilares de conformidade da Lei de Responsabilidade Fiscal, pisos de Saúde/Educação e CAUC.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm transition cursor-pointer shadow-xs"
            title="Imprimir Certificado Oficial do Município"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Certificado</span>
          </button>
        </div>
      </div>

      {/* Certificado Oficial Visual (Formato Diploma Institucional) */}
      <div
        id="certificado-oficial-gestao"
        className={`bg-gradient-to-b ${currentStyle.gradient} border-2 ${currentStyle.border} rounded-sm p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden`}
      >
        {/* Marca d'água de fundo */}
        <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
          <Award className="w-80 h-80 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full bg-white/10 border ${currentStyle.border}`}>
              <Award className={`w-8 h-8 ${currentStyle.iconColor}`} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                REPÚBLICA FEDERATIVA DO BRASIL • ESTADO DO PARANÁ
              </span>
              <h3 className="text-base font-bold uppercase tracking-tight text-white">
                CERTIFICADO OFICIAL DE CONFORMIDADE FISCAL
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
              SELO {payload.nivelSelo} DE EXCELÊNCIA
            </span>
            <span className="block text-[10px] font-mono text-slate-400 mt-1">
              Score Geral: <strong>{payload.pontuacaoTotal} / 100 pontos</strong>
            </span>
          </div>
        </div>

        {/* Texto do Parecer Conclusivo */}
        <div className="space-y-3 relative z-10">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-200 text-justify">
            {payload.parecerConclusivo}
          </p>
        </div>

        {/* Grade com os 6 Critérios no Certificado */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 relative z-10">
          {payload.criterios.map(c => (
            <div
              key={c.id}
              className="bg-black/30 border border-white/10 rounded-sm p-2.5 text-center space-y-1"
            >
              <span className="text-[9px] font-mono text-slate-400 block uppercase truncate" title={c.nome}>
                {c.nome.split('(')[0]}
              </span>
              <div className="text-xs font-bold font-mono text-emerald-400">
                {c.valorObtido.split('(')[0]}
              </div>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-300">
                <CheckCircle2 className="w-2.5 h-2.5" /> Cumprido
              </span>
            </div>
          ))}
        </div>

        {/* Rodapé de Autenticidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs font-mono text-slate-400 relative z-10">
          <div>
            <span className="block text-[10px] uppercase text-slate-500">Código de Autenticidade Digital</span>
            <span className="text-[11px] font-bold text-slate-300 select-all">{payload.codigoAutenticidade}</span>
          </div>
          <div className="sm:text-right">
            <span className="block text-[10px] uppercase text-slate-500">Data de Emissão & Validade</span>
            <span className="text-[11px] text-slate-300">Emitido em {payload.dataEmissao} • Exercício Fiscal {payload.ano}</span>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada de Auditoria dos 6 Critérios */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Detalhamento da Auditoria de Conformidade e Pontuação
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Total Obtido: {payload.pontuacaoTotal}/100 pts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Pilar de Conformidade</th>
                <th className="py-2.5 px-4">Exigência Legal</th>
                <th className="py-2.5 px-4">Resultado Apurado</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Pontos</th>
                <th className="py-2.5 px-4 font-sans">Fundamentação Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {payload.criterios.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-sans text-xs">
                    {c.nome}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.exigenciaLegal}
                  </td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                    {c.valorObtido}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {c.pontuacao} / {c.peso} pts
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                    {c.fundamentoLegal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Widget Incorporável no Portal da Transparência */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Widget do Selo para o Portal da Transparência Oficial
            </h3>
          </div>

          <button
            onClick={handleCopyEmbed}
            className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-sm transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Código HTML'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Copie e cole o código HTML abaixo no rodapé ou cabeçalho do <strong>Portal da Transparência de {payload.municipio.cidade}</strong> para exibir o selo digital auditado em tempo real.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto select-all">
          {payload.embedWidgetHtml}
        </div>
      </div>
    </div>
  );
};

export default SeloConformidade;
