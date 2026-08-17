import React, { useState } from 'react';
import {
  ClipboardList, Wallet, FileText, PiggyBank,
  TrendingUp, AlertTriangle, RefreshCw, ChevronDown, ChevronRight,
  Shield, Info, Check, CheckCircle2, Layers, Search, Filter,
  Building2, ExternalLink, X, Calendar, Download, Eye, DollarSign,
  Landmark, ShieldAlert, Award, FileCheck, ArrowUpRight, Upload
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { EscopoPainel } from '../../types/painel';
import { formatCurrency, formatCompactCurrency, exportToCSV } from '../../utils/formatters';

interface PainelGestaoPageProps {
  tenantId: string;
  cidade: string;
  uf: string;
  authRole: string;
  userSecretariaId?: string;
}

export interface ContratoTcePncpDetalhado {
  id: string;
  numero: string;
  processo: string;
  protocoloTce: string;
  idPncp: string;
  ano: number;
  secretaria: string;
  secretariaNome: string;
  fornecedor: string;
  cnpj: string;
  objeto: string;
  valorTotal: number;
  valorLiquidado: number;
  valorEmpenhado: number;
  saldoDisponivel: number;
  pctExecutado: number;
  dataAssinatura: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  diasRestantes: number;
  status: 'VIGENTE' | 'A_VENCER_60D' | 'EM_RENOVACAO' | 'AUDITORIA_TCE';
  fonteOrigem: 'PNCP' | 'TCE-PR';
  modalidade: string;
  fonteRecurso: string;
  essencialidade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'BAIXA';
  fiscalNome: string;
  fiscalMatricula: string;
  historicoMensal: Array<{ mes: string; liquidado: number; empenhado: number }>;
}

// 10 Fontes Oficiais Conectadas
const FONTES_CONECTADAS = [
  { nome: 'SICONFI', orgao: 'Secretaria do Tesouro Nacional (STN)', status: 'CONECTADO' },
  { nome: 'SIOPS', orgao: 'Ministério da Saúde', status: 'HOMOLOGADO' },
  { nome: 'SIOPE', orgao: 'FNDE / Ministério da Educação', status: 'HOMOLOGADO' },
  { nome: 'CAUC', orgao: 'Tesouro Nacional / Regularidade Fiscal', status: 'ADIMPLENTE' },
  { nome: 'PNCP', orgao: 'Portal Nacional de Contratações Públicas', status: 'CONECTADO' },
  { nome: 'TRANSPARÊNCIA CGU', orgao: 'Controladoria-Geral da União', status: 'CONECTADO' },
  { nome: 'IBGE', orgao: 'Inst. Brasileiro de Geografia e Estatística', status: 'OFICIAL' },
  { nome: 'IPARDES', orgao: 'Inst. Paranaense de Desenv. Econômico', status: 'OFICIAL' },
  { nome: 'BACEN SGS', orgao: 'Banco Central do Brasil', status: 'OFICIAL' },
  { nome: 'NOVO PAC', orgao: 'Governo Federal / Casa Civil', status: 'CONECTADO' },
];

// Dados do histórico mensal e projeção (Contrato 142/2025)
const GASTOS_HISTORICO_PROJECAO = [
  { mes: 'jul/24', realizado: 0.85, projecao: null },
  { mes: 'set/24', realizado: 1.02, projecao: null },
  { mes: 'nov/24', realizado: 0.98, projecao: null },
  { mes: 'jan/25', realizado: 1.15, projecao: null },
  { mes: 'mar/25', realizado: 1.28, projecao: null },
  { mes: 'mai/25', realizado: 1.22, projecao: null },
  { mes: 'jul/25', realizado: 1.45, projecao: null },
  { mes: 'set/25', realizado: 1.38, projecao: null },
  { mes: 'nov/25', realizado: 1.52, projecao: null },
  { mes: 'jan/26', realizado: 1.42, projecao: null },
  { mes: 'mar/26', realizado: 1.50, projecao: null },
  { mes: 'mai/26', realizado: 1.48, projecao: null },
  { mes: 'jul/26', realizado: 1.57, projecao: 1.57 },
  { mes: 'set/26', realizado: null, projecao: 1.62 },
  { mes: 'nov/26', realizado: null, projecao: 1.68 },
  { mes: 'Fech. 2026', realizado: null, projecao: 1.72, isFechamento: true },
];

// Distribuição de representatividade no orçamento da secretaria (Donut)
const REPRESENTATIVIDADE_DATA = [
  { name: 'Folha terceirizada / Serviços', value: 15.8, color: '#1e3a8a' },
  { name: 'Tecnologia', value: 11.8, color: '#2563eb' },
  { name: 'Limpeza', value: 9.3, color: '#0284c7' },
  { name: 'Vigilância', value: 7.7, color: '#10b981' },
  { name: 'Locação de veículos', value: 5.8, color: '#eab308' },
  { name: 'Telefonia', value: 4.3, color: '#f97316' },
  { name: 'Manutenção predial', value: 3.4, color: '#64748b' },
  { name: 'Outros', value: 6.3, color: '#8b5cf6' },
  { name: 'Demais contratos (58)', value: 35.6, color: '#cbd5e1' },
];

// Onde estamos gastando (Barras horizontais)
const GASTOS_CATEGORIAS = [
  { label: 'Folha terceirizada / Serviços', valor: 'R$ 28,5 mi', pct: 100 },
  { label: 'Tecnologia', valor: 'R$ 21,2 mi', pct: 74 },
  { label: 'Limpeza', valor: 'R$ 16,8 mi', pct: 59 },
  { label: 'Vigilância', valor: 'R$ 13,9 mi', pct: 49 },
  { label: 'Locação de veículos', valor: 'R$ 10,4 mi', pct: 36 },
  { label: 'Telefonia', valor: 'R$ 7,8 mi', pct: 27 },
  { label: 'Manutenção predial', valor: 'R$ 6,1 mi', pct: 21 },
  { label: 'Outros', valor: 'R$ 11,3 mi', pct: 40 },
];

// Tabela de Secretarias (Simulador)
const SECRETARIAS_SIMULADOR = [
  { nome: 'Saúde', contratos: 112, despesa: '220.000.000', pctPref: '34,4%', corte25: '55.000.000', potencial: '12.000.000', destaque: false },
  { nome: 'Educação', contratos: 98, despesa: '180.000.000', pctPref: '28,1%', corte25: '45.000.000', potencial: '18.000.000', destaque: false },
  { nome: 'Administração', contratos: 73, despesa: '75.000.000', pctPref: '11,7%', corte25: '18.750.000', potencial: '15.000.000', destaque: true },
  { nome: 'Obras', contratos: 61, despesa: '65.000.000', pctPref: '10,2%', corte25: '16.250.000', potencial: '22.000.000', destaque: false },
  { nome: 'Demais Secretarias', contratos: 143, despesa: '100.000.000', pctPref: '15,6%', corte25: '25.000.000', potencial: '31.000.000', destaque: false },
];

// Oportunidades de Redução (Top Contratos)
const OPORTUNIDADES_REDUCAO = [
  { contrato: 'Publicidade', valor: '8.000.000', pct: '1,2%', essencialidade: 'BAIXA', corEss: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700', reducaoPossivel: '60%', economia: '4.800.000' },
  { contrato: 'Consultoria', valor: '5.000.000', pct: '0,8%', essencialidade: 'BAIXA', corEss: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700', reducaoPossivel: '50%', economia: '2.500.000' },
  { contrato: 'Locação veículos', valor: '12.000.000', pct: '1,9%', essencialidade: 'MÉDIA', corEss: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700', reducaoPossivel: '20%', economia: '2.400.000' },
  { contrato: 'Vigilância', valor: '20.000.000', pct: '3,1%', essencialidade: 'ALTA', corEss: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700', reducaoPossivel: '10%', economia: '2.000.000' },
  { contrato: 'Limpeza hospitalar', valor: '35.000.000', pct: '5,5%', essencialidade: 'CRÍTICA', corEss: 'text-rose-900 bg-rose-100 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-600', reducaoPossivel: '0%', economia: '0' },
];

// Economia por secretaria (Cenário Central de Decisão)
const ECONOMIA_CENARIO_SECRETARIAS = [
  { secretaria: 'Obras', valor: 'R$ 14,2 mi', pct: 100 },
  { secretaria: 'Administração', valor: 'R$ 10,8 mi', pct: 76 },
  { secretaria: 'Urbanismo', valor: 'R$ 8,7 mi', pct: 61 },
  { secretaria: 'Educação', valor: 'R$ 7,1 mi', pct: 50 },
  { secretaria: 'Saúde', valor: 'R$ 3,2 mi', pct: 22 },
  { secretaria: 'Demais Secretarias', valor: 'R$ 7,8 mi', pct: 55 },
];

import { syncRealContractsFromPncp } from '../../data/contratosTcePncp';
import { ModalCentralImportacao } from './ModalCentralImportacao';

export const PainelGestaoPage: React.FC<PainelGestaoPageProps> = ({
  tenantId, cidade, uf, authRole, userSecretariaId,
}) => {
  const [escopo, setEscopo] = useState<EscopoPainel>('prefeitura');
  const [secretariaSelecionada, setSecretariaSelecionada] = useState('Administração');
  const [ano, setAno] = useState(2025);
  const [contratoSelecionado, setContratoSelecionado] = useState('Vigilância - Contrato 142/2025');
  const [metaEconomia, setMetaEconomia] = useState('25%');
  const [cenarioSelecionado, setCenarioSelecionado] = useState('Economizar R$ 50 milhões');
  const [, setRefreshKey] = useState(0);

  // Estados dos Contratos Oficiais PNCP
  const [contratosLista, setContratosLista] = useState<ContratoTcePncpDetalhado[]>([]);
  const [isSyncingPncp, setIsSyncingPncp] = useState(false);
  const [isContratosModalOpen, setIsContratosModalOpen] = useState(false);
  const [isCentralImportacaoOpen, setIsCentralImportacaoOpen] = useState(false);
  const [contratoDetalhe, setContratoDetalhe] = useState<ContratoTcePncpDetalhado | null>(null);
  const [filtroSecContratos, setFiltroSecContratos] = useState<string>('todas');
  const [filtroFonteContratos, setFiltroFonteContratos] = useState<'todas' | 'PNCP' | 'TCE-PR'>('todas');
  const [filtroStatusContratos, setFiltroStatusContratos] = useState<string>('todos');
  const [buscaContratos, setBuscaContratos] = useState<string>('');

  // Sincronização em Tempo Real com a API Oficial do PNCP (CNPJ 76.105.535/0001-99)
  const carregarContratosPncp = async () => {
    setIsSyncingPncp(true);
    try {
      // 1. Busca contratos cadastrados no banco da prefeitura logada
      const getRes = await fetch(`/api/painel/contratos?tenantId=${tenantId || ''}&ano=${ano}`);
      if (getRes.ok) {
        const getData = await getRes.json();
        if (Array.isArray(getData.contratos) && getData.contratos.length > 0) {
          setContratosLista(getData.contratos);
          setIsSyncingPncp(false);
          return;
        }
      }

      // 2. Se não houver contratos no banco, sincroniza com o PNCP
      const res = await fetch('/api/painel/sincronizar-pncp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ano, cnpj: '76.105.535/0001-99' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contratos) && data.contratos.length > 0) {
          setContratosLista(data.contratos);
        }
      }
    } catch (e) {
      console.warn('[PNCP Sync Warning]', e);
    } finally {
      setIsSyncingPncp(false);
    }
  };

  React.useEffect(() => {
    carregarContratosPncp();
  }, [ano, tenantId]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    carregarContratosPncp();
  };

  // Filtragem dos Contratos Reais
  const contratosFiltrados = contratosLista.filter(c => {
    if (!c) return false;
    const secNome = (c.secretariaNome || c.secretaria || '').toLowerCase();
    const filtroSec = filtroSecContratos.toLowerCase();
    const matchSec = filtroSecContratos === 'todas' || secNome.includes(filtroSec);
    const matchFonte = filtroFonteContratos === 'todas' || c.fonteOrigem === filtroFonteContratos;
    const matchStatus = filtroStatusContratos === 'todos' || c.status === filtroStatusContratos;
    const b = buscaContratos.toLowerCase().trim();
    const matchBusca = b === '' ||
      (c.numero && String(c.numero).toLowerCase().includes(b)) ||
      (c.fornecedor && String(c.fornecedor).toLowerCase().includes(b)) ||
      (c.objeto && String(c.objeto).toLowerCase().includes(b)) ||
      (c.cnpj && String(c.cnpj).includes(b)) ||
      (c.processo && String(c.processo).toLowerCase().includes(b));
    return matchSec && matchFonte && matchStatus && matchBusca;
  });

  const exportarContratosCSV = () => {
    exportToCSV(`contratos_oficiais_pncp_${cidade.toLowerCase()}_${ano}`, contratosFiltrados.map(c => ({
      'Número Contrato': c.numero,
      'Ano': c.ano,
      'Secretaria': c.secretariaNome,
      'Fornecedor': c.fornecedor,
      'CNPJ': c.cnpj,
      'Objeto': c.objeto,
      'Valor Total (R$)': c.valorTotal,
      'Valor Liquidado (R$)': c.valorLiquidado,
      'Valor Empenhado (R$)': c.valorEmpenhado,
      'Saldo Disponível (R$)': c.saldoDisponivel,
      'Início Vigência': c.dataVigenciaInicio,
      'Fim Vigência': c.dataVigenciaFim,
      'Status': c.status,
      'Fonte Origem': c.fonteOrigem,
      'Modalidade': c.modalidade,
      'Fonte de Recurso': c.fonteRecurso,
      'Fiscal': c.fiscalNome,
    })));
  };

  return (
    <div className="space-y-4 pb-12 font-sans text-slate-800 dark:text-slate-100">
      {/* ============================================================
          1. HEADER SUPERIOR DA PÁGINA
          ============================================================ */}
      <div className="bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-[#0a1128] text-white border border-navy-700 font-sans flex items-center gap-1">
              <ClipboardList className="w-3 h-3 text-emerald-400" />
              GESTÃO INTEGRADA • {cidade.toUpperCase()} / {uf}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white uppercase font-sans">
            PAINEL DE GESTÃO ORÇAMENTÁRIA E CONTRATUAL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
            Decisões inteligentes para uma cidade sustentável • Dados oficiais auditados TCE-PR & PNCP
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap font-sans">
          {/* Botão Importar Fontes (APIs, Planilhas, XMLs) */}
          <button
            type="button"
            onClick={() => setIsCentralImportacaoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition uppercase cursor-pointer shadow-xs border border-emerald-600"
            title="Importar fontes de dados: APIs REST, Planilhas CSV/Excel e Arquivos XML"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Fontes (API / Planilha / XML)</span>
          </button>

          {/* Botão Ver Todos os Contratos TCE-PR / PNCP */}
          <button
            type="button"
            onClick={() => setIsContratosModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0a1128] hover:bg-[#1a2a52] text-white text-xs font-bold transition uppercase cursor-pointer shadow-xs border border-navy-700"
            title="Listar e detalhar todos os contratos do TCE-PR e PNCP por secretaria"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Contratos PNCP ({contratosLista.length})</span>
          </button>

          {/* Toggle Visão: Prefeitura | Secretaria */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
            <span className="text-[11px] uppercase text-slate-500 font-bold">VISÃO:</span>
            <div className="inline-flex bg-slate-100 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-full p-0.5">
              <button
                onClick={() => setEscopo('prefeitura')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  escopo === 'prefeitura'
                    ? 'bg-[#0a1128] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Prefeitura
              </button>
              <button
                onClick={() => setEscopo('secretaria')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  escopo === 'secretaria'
                    ? 'bg-[#0a1128] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Secretaria
              </button>
            </div>
          </div>

          {/* Select Secretaria */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-0.5 font-sans">
              SECRETARIA:
            </span>
            <div className="relative">
              <select
                value={secretariaSelecionada}
                onChange={e => setSecretariaSelecionada(e.target.value)}
                className="text-xs font-sans font-semibold bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 rounded-sm px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-navy-600 shadow-xs"
              >
                <option value="Administração">Administração</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Obras">Obras e Serviços Públicos</option>
                <option value="Urbanismo">Urbanismo</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Select Exercício */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-0.5 font-sans">
              EXERCÍCIO:
            </span>
            <div className="relative">
              <select
                value={ano}
                onChange={e => setAno(Number(e.target.value))}
                className="text-xs font-sans font-bold bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 rounded-sm px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-navy-600 shadow-xs"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Atualizado em */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-0.5 font-sans">
              ATUALIZADO EM:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-sans font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 px-3 py-1.5 rounded-sm">
                31/07/2026 08:30
              </span>
              <button
                onClick={handleRefresh}
                title="Atualizar dados do painel"
                className="p-1.5 rounded-sm bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BARRA DAS 10 FONTES GOVERNAMENTAIS OFICIAIS HOMOLOGADAS
          ============================================================ */}
      <div className="bg-slate-50 dark:bg-navy-900/60 border border-slate-200/90 dark:border-navy-800/80 rounded-sm px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>FONTES GOVERNAMENTAIS CONECTADAS (10 CONECTORES OFICIAIS):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FONTES_CONECTADAS.map((fonte) => (
            <span
              key={fonte.nome}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              title={`${fonte.nome} — ${fonte.orgao}`}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>{fonte.nome}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ============================================================
          2. BLOCO 1 — SAÚDE FINANCEIRA
          ============================================================ */}
      <div className="bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm overflow-hidden font-sans">
        {/* Barra de Título do Bloco */}
        <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase flex items-center justify-between">
          <span>BLOCO 1 — SAÚDE FINANCEIRA</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Fileira de 6 Cards de KPI com Círculos Coloridos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-sans">
            {/* 1. Orçamento Total */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#101a3a] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                $
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  ORÇAMENTO TOTAL
                </span>
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight tabular-nums block font-sans">
                  R$ 180,0 mi
                </span>
              </div>
            </div>

            {/* 2. Empenhado */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  EMPENHADO
                </span>
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight tabular-nums block font-sans">
                  R$ 126,0 mi
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">70%</span>
              </div>
            </div>

            {/* 3. Liquidado */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  LIQUIDADO
                </span>
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight tabular-nums block font-sans">
                  R$ 91,8 mi
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">51%</span>
              </div>
            </div>

            {/* 4. Saldo Orçamentário */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  SALDO ORÇAMENTÁRIO
                </span>
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight tabular-nums block font-sans">
                  R$ 54,0 mi
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">30%</span>
              </div>
            </div>

            {/* 5. Contratos Ativos */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  CONTRATOS ATIVOS
                </span>
                <span className="font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white tracking-tight block mt-0.5 font-sans">
                  73
                </span>
              </div>
            </div>

            {/* 6. Valor Contratual Disponível */}
            <div className="bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 p-3 rounded-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#06b6d4] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                  VALOR CONTRATUAL DISPONÍVEL
                </span>
                <span className="font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight tabular-nums block font-sans">
                  R$ 42,6 mi
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">23,7%</span>
              </div>
            </div>
          </div>

          {/* Barra Segmentada Tri-Color */}
          <div className="space-y-1.5 pt-1 font-sans">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
              ORÇAMENTO 2026 — R$ 180,0 mi
            </div>
            <div className="w-full h-8 rounded-sm overflow-hidden flex text-[11px] font-bold text-white shadow-xs">
              <div
                style={{ width: '51%' }}
                className="bg-[#10b981] flex items-center justify-center px-2 truncate transition-all duration-500"
                title="51% Liquidado (R$ 91,8 mi)"
              >
                51% Liquidado (R$ 91,8 mi)
              </div>
              <div
                style={{ width: '19%' }}
                className="bg-[#f59e0b] flex items-center justify-center px-2 truncate transition-all duration-500"
                title="19% Empenhado a Liquidar (R$ 34,2 mi)"
              >
                19% Empenhado a Liquidar (R$ 34,2 mi)
              </div>
              <div
                style={{ width: '30%' }}
                className="bg-[#cbd5e1] dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center px-2 truncate transition-all duration-500"
                title="30% Disponível (R$ 54,0 mi)"
              >
                30% Disponível (R$ 54,0 mi)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          3. LINHA DO MEIO — 3 BLOCOS (ONDE ESTAMOS GASTANDO / COMPORTAMENTO DOS GASTOS / REPRESENTATIVIDADE)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans">
        {/* BLOCO 2 — ONDE ESTAMOS GASTANDO? (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase">
              BLOCO 2 — ONDE ESTAMOS GASTANDO?
            </div>
            <div className="p-3.5 space-y-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Contratos - maior para menor (valor total do contrato)
              </div>

              {/* Lista de Barras Horizontais */}
              <div className="space-y-2 pt-1 font-sans">
                {GASTOS_CATEGORIAS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-36 sm:w-44">
                      {item.label}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-navy-900 rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-[#1a2a52] dark:bg-blue-600 rounded-xs transition-all duration-500"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 shrink-0 w-18 text-right tabular-nums">
                        {item.valor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Tabela Inferior: Total dos Contratos */}
          <div className="p-3.5 border-t border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/50 font-sans">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
              TOTAL DOS CONTRATOS
            </span>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="bg-white dark:bg-navy-950 p-1.5 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-[9px] text-slate-400 block font-medium">Valor total</span>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums">R$ 126,0 mi</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1.5 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-[9px] text-slate-400 block font-medium">Liquidado</span>
                <span className="text-[11px] font-bold text-emerald-600 tabular-nums">R$ 68,7 mi</span>
                <span className="text-[9px] text-slate-500 block font-medium">54,5%</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1.5 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-[9px] text-slate-400 block font-medium">Empenhado</span>
                <span className="text-[11px] font-bold text-amber-600 tabular-nums">R$ 16,5 mi</span>
                <span className="text-[9px] text-slate-500 block font-medium">13,1%</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1.5 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-[9px] text-slate-400 block font-medium">Disponível</span>
                <span className="text-[11px] font-bold text-blue-600 tabular-nums">R$ 40,8 mi</span>
                <span className="text-[9px] text-slate-500 block font-medium">32,4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3 — COMPORTAMENTO DOS GASTOS (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm flex flex-col justify-between overflow-hidden font-sans">
          <div>
            <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase">
              BLOCO 3 — COMPORTAMENTO DOS GASTOS
            </div>

            <div className="p-3.5 space-y-3">
              {/* Linha de Seletor de Contrato */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Gasto mensal do contrato selecionado
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Contrato:</span>
                  <select
                    value={contratoSelecionado}
                    onChange={e => setContratoSelecionado(e.target.value)}
                    className="text-[11px] font-sans font-medium bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-sm px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Vigilância - Contrato 142/2025">Vigilância - Contrato 142/2025</option>
                    <option value="Limpeza - Contrato 088/2024">Limpeza - Contrato 088/2024</option>
                    <option value="Tecnologia - Contrato 210/2025">Tecnologia - Contrato 210/2025</option>
                  </select>
                </div>
              </div>

              {/* Gráfico de Linha + Caixa Lateral de Métricas */}
              <div className="grid grid-cols-12 gap-2 pt-1 items-center">
                <div className="col-span-8 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={GASTOS_HISTORICO_PROJECAO} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'Inter' }} axisLine={false} tickLine={false} domain={[0, 2.0]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a1128', borderColor: '#1e3a8a', fontSize: '11px', color: '#fff', fontFamily: 'Inter' }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)} mi`, 'Gasto']}
                      />
                      <Area type="monotone" dataKey="realizado" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorRealizado)" connectNulls={false} />
                      <Area type="monotone" dataKey="projecao" stroke="#2563eb" strokeDasharray="3 3" strokeWidth={2} fill="none" connectNulls={true} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Caixa Lateral com Métricas Chave */}
                <div className="col-span-4 bg-slate-50 dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800 space-y-1.5 text-[10px] font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Média mensal 2026</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">R$ 1,42 mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Último mês (jul/26)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">R$ 1,57 mi</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600 font-bold">
                    <span>Tendência</span>
                    <span className="tabular-nums">↑ 8,3%</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-navy-800 pt-1 flex justify-between">
                    <span className="text-slate-500 font-medium">Projeção 2026</span>
                    <span className="font-bold text-blue-600 tabular-nums">R$ 18,4 mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Orçamento disp.</span>
                    <span className="font-bold text-emerald-600 tabular-nums">R$ 17,1 mi</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500 font-bold">Risco projetado</span>
                    <span className="px-1 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 rounded-xs font-bold text-[9px] tabular-nums">
                      -R$ 1,3 mi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Detalhe do Contrato Selecionado */}
          <div className="p-3 border-t border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/50 space-y-2 font-sans">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1a2a52] text-white flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate font-sans">
                  Contrato 142/2025 - Empresa XYZ
                </span>
                <span className="text-[10px] text-slate-500 block truncate font-medium">
                  Objeto: Serviços de vigilância patrimonial armada
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 text-center text-[9px] pt-1 font-sans">
              <div className="bg-white dark:bg-navy-950 p-1 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block font-medium">Valor total</span>
                <span className="font-bold text-slate-900 dark:text-white text-[10px] tabular-nums">R$ 13,9 mi</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block font-medium">Liquidado</span>
                <span className="font-bold text-emerald-600 tabular-nums">54,7%</span>
                <span className="text-[8px] text-slate-500 block font-medium tabular-nums">R$ 7,6 mi</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block font-medium">Empenhado</span>
                <span className="font-bold text-amber-600 tabular-nums">15,1%</span>
                <span className="text-[8px] text-slate-500 block font-medium tabular-nums">R$ 2,1 mi</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block font-medium">Disponível</span>
                <span className="font-bold text-blue-600 tabular-nums">30,2%</span>
                <span className="text-[8px] text-slate-500 block font-medium tabular-nums">R$ 4,2 mi</span>
              </div>
              <div className="bg-white dark:bg-navy-950 p-1 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block font-medium">Representat.</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px] tabular-nums">7,7%</span>
              </div>
            </div>

            {/* Tags de Essencialidade e Corte */}
            <div className="flex items-center gap-1.5 flex-wrap text-[9px] pt-1 font-sans">
              <span className="text-slate-500">Classificação: <strong className="text-slate-800 dark:text-slate-200">Serviço contínuo</strong></span>
              <span>•</span>
              <span className="text-slate-500">Essencialidade: <strong className="text-rose-600 font-bold">ALTA</strong></span>
              <span>•</span>
              <span className="text-slate-500">Potencial redução: <strong className="text-amber-600 font-bold">BAIXO</strong></span>
              <span>•</span>
              <span className="text-slate-500">Impacto corte: <strong className="text-rose-600 font-bold">ALTO</strong></span>
            </div>
          </div>
        </div>

        {/* BLOCO 2 — REPRESENTATIVIDADE NO ORÇAMENTO (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm flex flex-col justify-between overflow-hidden font-sans">
          <div>
            <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase">
              BLOCO 2 — REPRESENTATIVIDADE NO ORÇAMENTO
            </div>
            <div className="p-3.5 space-y-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Participação de cada contrato no orçamento da secretaria
              </div>

              {/* Gráfico Donut + Legenda */}
              <div className="grid grid-cols-12 gap-2 items-center pt-1">
                {/* Donut Chart */}
                <div className="col-span-6 h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={REPRESENTATIVIDADE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {REPRESENTATIVIDADE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Participação']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centro do Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center font-sans">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Total</span>
                    <span className="font-extrabold text-xs text-slate-950 dark:text-white tabular-nums">R$ 180,0 mi</span>
                  </div>
                </div>

                {/* Legenda Lateral */}
                <div className="col-span-6 space-y-1 text-[10px] font-sans">
                  {REPRESENTATIVIDADE_DATA.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-[95px] font-medium" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0 text-[9px] tabular-nums">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/50 text-center font-sans">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Os <strong>8 maiores contratos</strong> representam <strong>64,4%</strong> do orçamento da secretaria.
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          4. LINHA INFERIOR — SIMULADOR DE CONTINGENCIAMENTO & CENTRAL DE DECISÃO
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans">
        {/* BLOCO 4 — SIMULADOR DE CONTINGENCIAMENTO (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase flex items-center justify-between">
              <span>BLOCO 4 — SIMULADOR DE CONTINGENCIAMENTO</span>
            </div>

            <div className="p-3.5 space-y-4 font-sans">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Simule cenários de redução e veja o impacto por secretaria</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-sans text-[11px]">META DE ECONOMIA:</span>
                    <select
                      value={metaEconomia}
                      onChange={e => setMetaEconomia(e.target.value)}
                      className="bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 font-bold text-emerald-600 rounded-sm px-2 py-1 text-xs font-sans"
                    >
                      <option value="10%">10%</option>
                      <option value="15%">15%</option>
                      <option value="20%">20%</option>
                      <option value="25%">25%</option>
                      <option value="30%">30%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resumo de Metas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-800 font-sans text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Despesa contratual Prefeitura</span>
                  <span className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base tabular-nums">R$ 640,0 mi</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Economia teórica de {metaEconomia}</span>
                  <span className="font-extrabold text-blue-600 text-sm sm:text-base tabular-nums">R$ 160,0 mi</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Potencial viável identificado</span>
                  <span className="font-extrabold text-emerald-600 text-sm sm:text-base tabular-nums">R$ 98,0 mi</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Atingimento da meta</span>
                  <span className="font-extrabold text-amber-600 text-sm sm:text-base tabular-nums">61,2% viável</span>
                </div>
              </div>

              {/* 2 Tabelas Lado a Lado (Secretarias + Top Oportunidades) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 font-sans">
                {/* Tabela de Secretarias (7 cols) */}
                <div className="md:col-span-7 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                    DISTRIBUIÇÃO POR SECRETARIA
                  </span>
                  <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-sm">
                    <table className="w-full text-xs font-sans text-left">
                      <thead className="bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-navy-800 text-[11px]">
                        <tr>
                          <th className="p-1.5">Secretaria</th>
                          <th className="p-1.5 text-center">Contr.</th>
                          <th className="p-1.5 text-right">Despesa (R$)</th>
                          <th className="p-1.5 text-right">% Pref.</th>
                          <th className="p-1.5 text-right">Corte 25%</th>
                          <th className="p-1.5 text-right">Potencial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300 text-[11px] tabular-nums">
                        {SECRETARIAS_SIMULADOR.map((s, idx) => (
                          <tr
                            key={idx}
                            className={s.destaque ? 'bg-sky-50 dark:bg-navy-900 font-bold text-sky-950 dark:text-sky-200' : 'hover:bg-slate-50/50'}
                          >
                            <td className="p-1.5 font-medium">{s.nome}</td>
                            <td className="p-1.5 text-center">{s.contratos}</td>
                            <td className="p-1.5 text-right">{s.despesa}</td>
                            <td className="p-1.5 text-right">{s.pctPref}</td>
                            <td className="p-1.5 text-right text-blue-600 font-semibold">{s.corte25}</td>
                            <td className="p-1.5 text-right text-amber-600 font-semibold">{s.potencial}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 dark:bg-navy-900 font-bold text-slate-950 dark:text-white">
                          <td className="p-1.5 uppercase">TOTAL</td>
                          <td className="p-1.5 text-center">487</td>
                          <td className="p-1.5 text-right">640.000.000</td>
                          <td className="p-1.5 text-right">100%</td>
                          <td className="p-1.5 text-right text-blue-600">160.000.000</td>
                          <td className="p-1.5 text-right text-emerald-600">98.000.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela de Oportunidades de Redução (5 cols) */}
                <div className="md:col-span-5 space-y-1.5 font-sans">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                    ÍNDICE DE OPORTUNIDADE DE REDUÇÃO (Top contratos)
                  </span>
                  <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-sm">
                    <table className="w-full text-xs font-sans text-left">
                      <thead className="bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-navy-800 text-[11px]">
                        <tr>
                          <th className="p-1.5">Contrato</th>
                          <th className="p-1.5 text-right">Valor (R$)</th>
                          <th className="p-1.5 text-center">Essenc.</th>
                          <th className="p-1.5 text-right">Economia (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300 text-[11px] tabular-nums">
                        {OPORTUNIDADES_REDUCAO.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-1.5 font-medium truncate max-w-[90px]">{c.contrato}</td>
                            <td className="p-1.5 text-right">{c.valor}</td>
                            <td className="p-1.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border ${c.corEss}`}>
                                {c.essencialidade}
                              </span>
                            </td>
                            <td className="p-1.5 text-right text-emerald-600 font-bold">{c.economia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 border-t border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/50 text-left text-[10px] text-slate-500 font-medium font-sans">
            Obs.: Potencial recomendado considera essencialidade, impacto operacional e possibilidade real de redução contratual.
          </div>
        </div>

        {/* CENTRAL DE DECISÃO — CENÁRIOS (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm overflow-hidden flex flex-col justify-between font-sans">
          <div>
            <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase">
              CENTRAL DE DECISÃO — CENÁRIOS
            </div>

            <div className="p-3.5 space-y-3 font-sans">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Escolha a meta de economia e veja a melhor combinação
              </div>

              {/* Seletor de Cenário */}
              <div className="flex items-center gap-2 text-xs font-sans">
                <span className="text-slate-500 uppercase text-[10px] font-bold">Cenário:</span>
                <select
                  value={cenarioSelecionado}
                  onChange={e => setCenarioSelecionado(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 font-sans text-xs font-medium rounded-sm px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Economizar R$ 50 milhões">Economizar R$ 50 milhões</option>
                  <option value="Economizar R$ 80 milhões">Economizar R$ 80 milhões</option>
                  <option value="Corte Linear de 15%">Corte Linear de 15%</option>
                  <option value="Preservação Total de Saúde e Educação">Preservação Total Saúde/Educação</option>
                </select>
              </div>

              {/* 4 Mini Cards de Indicadores do Cenário */}
              <div className="grid grid-cols-2 gap-2 text-center font-sans">
                <div className="bg-slate-50 dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800">
                  <span className="text-[9px] text-slate-500 block font-medium">Contratos analisados</span>
                  <span className="font-extrabold text-slate-950 dark:text-white text-sm tabular-nums">487</span>
                </div>
                <div className="bg-slate-50 dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800">
                  <span className="text-[9px] text-slate-500 block font-medium">Contratos afetados</span>
                  <span className="font-extrabold text-slate-950 dark:text-white text-sm tabular-nums">63</span>
                </div>
                <div className="bg-slate-50 dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800">
                  <span className="text-[9px] text-slate-500 block font-medium">Essenciais afetados</span>
                  <span className="font-extrabold text-amber-600 text-sm tabular-nums">4</span>
                </div>
                <div className="bg-slate-50 dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800">
                  <span className="text-[9px] text-slate-500 block font-medium">Economia estimada</span>
                  <span className="font-extrabold text-emerald-600 text-sm tabular-nums">R$ 51,8 mi</span>
                </div>
              </div>

              {/* Tag de Impacto */}
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xs p-2 text-center text-xs font-sans font-bold text-emerald-800 dark:text-emerald-300">
                Impacto estimado nos serviços: BAIXO / MODERADO
              </div>

              {/* Gráfico de Barras de Economia por Secretaria */}
              <div className="space-y-2 pt-1 font-sans">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Economia por Secretaria (sugestão do cenário)
                </span>
                <div className="space-y-1.5">
                  {ECONOMIA_CENARIO_SECRETARIAS.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 w-28 truncate">
                        {item.secretaria}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-100 dark:bg-navy-900 rounded-xs overflow-hidden">
                          <div
                            className="h-full bg-[#1a2a52] dark:bg-blue-600 rounded-xs"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-slate-900 dark:text-slate-100 shrink-0 w-16 text-right tabular-nums">
                          {item.valor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-navy-800 font-sans">
            <button
              onClick={() => setIsContratosModalOpen(true)}
              className="w-full bg-[#0a1128] hover:bg-[#1a2a52] text-white font-bold py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>VER DETALHAMENTO DOS CONTRATOS (TCE-PR & PNCP)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          5. ALERTAS PARA DECISÃO (RODAPÉ)
          ============================================================ */}
      <div className="bg-white dark:bg-navy-950 border border-slate-200/90 dark:border-navy-800/80 rounded-sm shadow-sm overflow-hidden font-sans">
        <div className="bg-[#0a1128] text-white px-3.5 py-2 text-xs font-bold font-sans tracking-wide uppercase">
          ALERTAS PARA DECISÃO
        </div>

        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center font-sans">
          {/* 5 Mini Cards de Alertas */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* 1 */}
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-700 dark:text-rose-300 block text-xs">5 secretarias</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight block">
                  projetam estouro orçamentário
                </span>
              </div>
            </div>

            {/* 2 */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-sm flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-300 block text-xs">17 contratos</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight block">
                  apresentam crescimento &gt; 15% no ano
                </span>
              </div>
            </div>

            {/* 3 */}
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-sm flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                $
              </span>
              <div>
                <span className="font-bold text-rose-700 dark:text-rose-300 block text-xs tabular-nums">R$ 42,8 mi</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight block">
                  de déficit projetado para dezembro
                </span>
              </div>
            </div>

            {/* 4 */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-sm flex items-start gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-xs tabular-nums">R$ 31,4 mi</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight block">
                  de economia potencial identificada
                </span>
              </div>
            </div>

            {/* 5 */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-sm flex items-start gap-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-300 block text-xs">8 contratos</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight block">
                  representam 41% do gasto contratual
                </span>
              </div>
            </div>
          </div>

          {/* Card Resumo Executivo */}
          <div
            onClick={() => setIsContratosModalOpen(true)}
            className="md:col-span-4 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-3 rounded-sm flex items-center justify-between gap-3 font-sans cursor-pointer hover:border-navy-600 transition"
          >
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-950 dark:text-white block mb-0.5 font-bold">Resumo Executivo</strong>
              A situação orçamentária requer ações imediatas para evitar déficit de <strong>R$ 42,8 mi</strong> ao final de 2026. Há potencial de economia de <strong>R$ 31,4 mi</strong> com baixo impacto operacional.
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 hover:text-slate-600" />
          </div>
        </div>
      </div>

      {/* ============================================================
          6. MODAL COMPLETO — DETALHAMENTO DE CONTRATOS TCE-PR & PNCP
          ============================================================ */}
      {isContratosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-sm shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0a1128] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-xs border border-emerald-500/40">
                      TCE-PR & PNCP • LEI 14.133/2021
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {cidade.toUpperCase()} / {uf}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white mt-0.5">
                    Painel Geral de Contratos Públicos — Detalhamento por Secretaria
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportarContratosCSV}
                  className="px-3 py-1.5 bg-[#1a2a52] hover:bg-[#24376b] text-white text-xs font-bold rounded-xs transition flex items-center gap-1.5 border border-navy-700 cursor-pointer"
                  title="Exportar contratos para planilha CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={() => {
                    setIsContratosModalOpen(false);
                    setContratoDetalhe(null);
                  }}
                  className="p-1.5 rounded-sm hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Controls & Filters */}
            <div className="p-4 bg-slate-50 dark:bg-navy-900/80 border-b border-slate-200 dark:border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={buscaContratos}
                    onChange={e => setBuscaContratos(e.target.value)}
                    placeholder="Buscar por nº contrato, fornecedor, CNPJ ou objeto..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-900 dark:text-white focus:outline-none focus:border-navy-600"
                  />
                </div>

                {/* Secretaria Filter */}
                <select
                  value={filtroSecContratos}
                  onChange={e => setFiltroSecContratos(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                >
                  <option value="todas">🏢 Todas as Secretarias</option>
                  <option value="Saúde">SMSA - Saúde</option>
                  <option value="Educação">SMED - Educação</option>
                  <option value="Obras">SMOP - Obras Públicas</option>
                  <option value="Administração">SMA - Administração</option>
                  <option value="Segurança">SMSP - Segurança</option>
                </select>

                {/* Fonte Origem Filter */}
                <select
                  value={filtroFonteContratos}
                  onChange={e => setFiltroFonteContratos(e.target.value as any)}
                  className="px-3 py-1.5 bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                >
                  <option value="todas">🌐 Todas as Fontes</option>
                  <option value="PNCP">PNCP (Governo Federal)</option>
                  <option value="TCE-PR">TCE-PR (Mural Estadual)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filtroStatusContratos}
                  onChange={e => setFiltroStatusContratos(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                >
                  <option value="todos">🚦 Todos os Status</option>
                  <option value="VIGENTE">Vigente</option>
                  <option value="A_VENCER_60D">A Vencer (&lt; 60 dias)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={carregarContratosPncp}
                  disabled={isSyncingPncp}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Consultar API pública do PNCP (Lei 14.133/2021)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPncp ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPncp ? 'Consultando PNCP...' : 'Sincronizar PNCP Oficial'}</span>
                </button>

                <div className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                  {contratosFiltrados.length} contrato(s) oficial(is)
                </div>
              </div>
            </div>

            {/* Modal Body: Table or Detail Drawer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {contratoDetalhe ? (
                /* Ficha Detalhada do Contrato Selecionado */
                <div className="bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 rounded-sm p-5 space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between border-b border-slate-200 dark:border-navy-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-[#0a1128] text-white">
                          CONTRATO Nº {contratoDetalhe.numero} • EXERCÍCIO {contratoDetalhe.ano}
                        </span>
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          {contratoDetalhe.fonteOrigem}
                        </span>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                          contratoDetalhe.status === 'A_VENCER_60D'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        }`}>
                          {contratoDetalhe.status === 'A_VENCER_60D' ? `CRÍTICO • ${contratoDetalhe.diasRestantes} DIAS PARA VENCER` : 'VIGENTE'}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white uppercase">
                        {contratoDetalhe.fornecedor}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        CNPJ: {contratoDetalhe.cnpj} • Processo: {contratoDetalhe.processo} • Protocolo TCE: {contratoDetalhe.protocoloTce}
                      </p>
                    </div>

                    <button
                      onClick={() => setContratoDetalhe(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xs transition cursor-pointer"
                    >
                      ← Voltar para Lista
                    </button>
                  </div>

                  {/* Objeto */}
                  <div className="p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      OBJETO DA CONTRATAÇÃO (LEI 14.133/2021)
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {contratoDetalhe.objeto}
                    </p>
                  </div>

                  {/* 4 Cards Financeiros */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Total Homologado</span>
                      <span className="text-base font-extrabold text-slate-950 dark:text-white tabular-nums">
                        {formatCurrency(contratoDetalhe.valorTotal)}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Já Liquidado</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(contratoDetalhe.valorLiquidado)} ({contratoDetalhe.pctExecutado.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Empenhado</span>
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatCurrency(contratoDetalhe.valorEmpenhado)}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Disponível a Executar</span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatCurrency(contratoDetalhe.saldoDisponivel)}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Gestão e Fiscalização */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Secretaria e Fiscal</span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {contratoDetalhe.secretariaNome}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Fiscal: {contratoDetalhe.fiscalNome} ({contratoDetalhe.fiscalMatricula})
                      </div>
                    </div>

                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Vigência & Prazos</span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {contratoDetalhe.dataVigenciaInicio} até {contratoDetalhe.dataVigenciaFim}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Restam {contratoDetalhe.diasRestantes} dias • Assinado em {contratoDetalhe.dataAssinatura}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-navy-950 p-3 rounded-sm border border-slate-200 dark:border-navy-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Modalidade & Dotação</span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {contratoDetalhe.modalidade}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Fonte: {contratoDetalhe.fonteRecurso}
                      </div>
                    </div>
                  </div>

                  {/* Histórico Mensal de Pagamentos */}
                  <div className="bg-white dark:bg-navy-950 p-4 rounded-sm border border-slate-200 dark:border-navy-800 space-y-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block">
                      HISTÓRICO MENSAL DE MEDIÇÕES E LIQUIDAÇÕES (EXERCÍCIO {ano})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                      {contratoDetalhe.historicoMensal.map((h, i) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-navy-900 rounded border border-slate-200 dark:border-navy-800 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">{h.mes}</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block tabular-nums mt-0.5">
                            {formatCompactCurrency(h.liquidado)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : contratosFiltrados.length === 0 ? (
                /* Estado Vazio com Ação de Sincronização Direta */
                <div className="p-12 text-center bg-slate-50 dark:bg-navy-900/40 rounded-sm border border-dashed border-slate-300 dark:border-navy-700 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Base Oficial PNCP Pronta para Sincronização
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      Nenhum dado simulado ou fictício ativo. Clique no botão abaixo para consultar em tempo real a API Oficial do PNCP (Governo Federal) para a Prefeitura Municipal de Araucária (CNPJ <strong>76.105.535/0001-99</strong>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={carregarContratosPncp}
                    disabled={isSyncingPncp}
                    className="px-5 py-2.5 bg-[#0a1128] hover:bg-[#1a2a52] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingPncp ? 'animate-spin' : ''}`} />
                    <span>{isSyncingPncp ? 'Sincronizando com PNCP...' : 'Sincronizar Contratos do PNCP Agora'}</span>
                  </button>
                </div>
              ) : (
                /* Tabela Geral de Contratos Oficiais PNCP */
                <div className="border border-slate-200 dark:border-navy-800 rounded-sm overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-navy-800 text-[11px] uppercase">
                        <tr>
                          <th className="p-3">Contrato / Ano</th>
                          <th className="p-3">Secretaria</th>
                          <th className="p-3">Fornecedor / CNPJ</th>
                          <th className="p-3">Objeto</th>
                          <th className="p-3 text-right">Valor Total (R$)</th>
                          <th className="p-3 text-right">Liquidado (R$)</th>
                          <th className="p-3 text-center">Vigência</th>
                          <th className="p-3 text-center">Origem</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-800 dark:text-slate-200 text-xs">
                        {contratosFiltrados.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50 dark:hover:bg-navy-900/60 transition cursor-pointer"
                            onClick={() => setContratoDetalhe(c)}
                          >
                            <td className="p-3 font-bold whitespace-nowrap">
                              <span className="block text-slate-950 dark:text-white">Nº {c.numero}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{c.processo}</span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-navy-700">
                                {c.secretaria}
                              </span>
                            </td>

                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white font-bold truncate max-w-[180px]">
                                {c.fornecedor}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                CNPJ {c.cnpj}
                              </span>
                            </td>

                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate font-medium" title={c.objeto}>
                              {c.objeto}
                            </td>

                            <td className="p-3 text-right font-extrabold text-slate-950 dark:text-white whitespace-nowrap tabular-nums">
                              {formatCurrency(c.valorTotal)}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap tabular-nums">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                {formatCurrency(c.valorLiquidado)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {c.pctExecutado.toFixed(1)}% exec.
                              </span>
                            </td>

                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                                c.status === 'A_VENCER_60D'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {c.dataVigenciaFim} ({c.diasRestantes}d)
                              </span>
                            </td>

                            <td className="p-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                {c.fonteOrigem}
                              </span>
                            </td>

                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContratoDetalhe(c);
                                }}
                                className="px-2.5 py-1 bg-[#0a1128] hover:bg-[#1a2a52] text-white text-[11px] font-bold rounded-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver Ficha</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal da Central de Importação de Fontes (APIs, Planilhas, XMLs) */}
      <ModalCentralImportacao
        isOpen={isCentralImportacaoOpen}
        onClose={() => setIsCentralImportacaoOpen(false)}
        tenantId={tenantId}
        cidade={cidade}
        uf={uf}
        onImportSuccess={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};
