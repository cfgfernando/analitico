import React, { useState, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  X, RefreshCw, ChevronRight, Eye, ShieldCheck, Globe, Database,
  Code, FileCode, Layers, Link2, Sparkles, Check
} from 'lucide-react';
import { DataSourceBadge } from '../DataSourceBadge';

interface ModalCentralImportacaoProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  cidade: string;
  uf: string;
  onImportSuccess: () => void;
}

export const ModalCentralImportacao: React.FC<ModalCentralImportacaoProps> = ({
  isOpen,
  onClose,
  tenantId,
  cidade,
  uf,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'planilha' | 'xml'>('api');

  // Estados API
  const [apiUrl, setApiUrl] = useState('https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20250101&dataFinal=20251231&cnpjOrgao=76105535000199&pagina=1&tamanhoPagina=50');
  const [apiNome, setApiNome] = useState('PNCP / Portal Nacional');
  const [apiAuth, setApiAuth] = useState('');
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingPncpDireto, setLoadingPncpDireto] = useState(false);

  // Estados Planilha
  const [filePlanilha, setFilePlanilha] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [previewPlanilha, setPreviewPlanilha] = useState<any | null>(null);
  const [validandoPlanilha, setValidandoPlanilha] = useState(false);
  const [salvandoPlanilha, setSalvandoPlanilha] = useState(false);
  const filePlanilhaRef = useRef<HTMLInputElement>(null);

  // Estados XML
  const [fileXml, setFileXml] = useState<File | null>(null);
  const [xmlText, setXmlText] = useState<string>('');
  const [previewXml, setPreviewXml] = useState<any | null>(null);
  const [validandoXml, setValidandoXml] = useState(false);
  const [salvandoXml, setSalvandoXml] = useState(false);
  const fileXmlRef = useRef<HTMLInputElement>(null);

  // Feedback geral
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  if (!isOpen) return null;

  // --- Handlers Planilha ---
  const handlePlanilhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFilePlanilha(selected);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      validarPlanilha(content);
    };
    reader.readAsText(selected, 'UTF-8');
  };

  const validarPlanilha = async (content: string) => {
    setValidandoPlanilha(true);
    try {
      const res = await fetch('/api/painel/validar-planilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: content }),
      });
      const data = await res.json();
      setPreviewPlanilha(data);
      if (!data.valid) {
        setFeedback({ tipo: 'erro', texto: data.erros?.[0]?.mensagem || 'A planilha contém inconsistências.' });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Erro ao processar validação da planilha.' });
    } finally {
      setValidandoPlanilha(false);
    }
  };

  const salvarPlanilha = async () => {
    if (!csvText || !previewPlanilha?.valid) return;
    setSalvandoPlanilha(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/painel/importar-planilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvText, tenantId, userNome: 'Gestor Municipal' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'sucesso', texto: data.message });
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedback({ tipo: 'erro', texto: data.error || 'Falha ao salvar planilha.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'erro', texto: `Erro de conexão: ${e.message}` });
    } finally {
      setSalvandoPlanilha(false);
    }
  };

  // --- Handlers XML ---
  const handleXmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFileXml(selected);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setXmlText(content);
      validarXml(content);
    };
    reader.readAsText(selected, 'UTF-8');
  };

  const validarXml = async (content: string) => {
    setValidandoXml(true);
    try {
      const res = await fetch('/api/painel/validar-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent: content }),
      });
      const data = await res.json();
      setPreviewXml(data);
      if (!data.valid) {
        setFeedback({ tipo: 'erro', texto: data.erros?.[0] || 'Arquivo XML inválido.' });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Erro ao validar XML.' });
    } finally {
      setValidandoXml(false);
    }
  };

  const salvarXml = async () => {
    if (!xmlText || !previewXml?.valid) return;
    setSalvandoXml(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/painel/importar-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent: xmlText, tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'sucesso', texto: data.message });
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedback({ tipo: 'erro', texto: data.error || 'Falha ao salvar XML.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'erro', texto: `Erro de conexão: ${e.message}` });
    } finally {
      setSalvandoXml(false);
    }
  };

  // --- Handlers API ---
  const handleSincronizarPncpDireto = async () => {
    setLoadingPncpDireto(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/painel/sincronizar-pncp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ano: 2025, cnpj: '76.105.535/0001-99' }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { mensagem: text };
      }

      if (res.ok && data.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: data.mensagem || 'Sincronização com o PNCP concluída com sucesso!' });
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedback({ tipo: 'erro', texto: data.error || data.details || data.mensagem || 'Falha na resposta da sincronização.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'erro', texto: `Erro de conexão: ${e.message}` });
    } finally {
      setLoadingPncpDireto(false);
    }
  };

  const handleConectarApi = async () => {
    setLoadingApi(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/painel/conectar-api-generica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, authHeader: apiAuth, tenantId, nomeFonte: apiNome }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (res.ok && data.success) {
        setFeedback({ tipo: 'sucesso', texto: data.message });
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedback({ tipo: 'erro', texto: data.error || 'Falha ao conectar API externa.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'erro', texto: `Erro de conexão: ${e.message}` });
    } finally {
      setLoadingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a1128] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-xs border border-emerald-500/40">
                  CENTRAL DE IMPORTAÇÃO & SINCRONIZAÇÃO
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {cidade.toUpperCase()} / {uf}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white mt-0.5">
                Importar Contratos & Execução Orçamentária
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Tipo de Importação */}
        <div className="flex border-b border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-900/80 px-4 pt-3 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab('api'); setFeedback(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-sm transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'api'
                ? 'bg-white dark:bg-navy-950 text-slate-950 dark:text-white border-slate-200 dark:border-navy-800 border-b-transparent'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-500" />
            <span>1. Conectar APIs (PNCP, TCE-PR, ERP)</span>
          </button>

          <button
            onClick={() => { setActiveTab('planilha'); setFeedback(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-sm transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'planilha'
                ? 'bg-white dark:bg-navy-950 text-slate-950 dark:text-white border-slate-200 dark:border-navy-800 border-b-transparent'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>2. Importar Planilha (CSV / Excel)</span>
          </button>

          <button
            onClick={() => { setActiveTab('xml'); setFeedback(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-sm transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'xml'
                ? 'bg-white dark:bg-navy-950 text-slate-950 dark:text-white border-slate-200 dark:border-navy-800 border-b-transparent'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-500" />
            <span>3. Importar Arquivo XML (TCE / NF-e)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 mx-4 mt-4 rounded-xs border text-xs font-bold flex items-center gap-2 shrink-0 ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
          }`}>
            {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.texto}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ABA 1: APIs */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* Card Destaque: Sincronização 1-Click com o PNCP Oficial */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-xs">
                    CONECTOR NATIVO HOMOLOGADO (LEI 14.133/2021)
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase mt-1">
                    Portal Nacional de Contratações Públicas (PNCP)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sincroniza automaticamente todos os contratos oficiais pelo CNPJ da Prefeitura Municipal ({cidade} / {uf}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSincronizarPncpDireto}
                  disabled={loadingPncpDireto}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPncpDireto ? 'animate-spin' : ''}`} />
                  <span>{loadingPncpDireto ? 'Sincronizando PNCP...' : 'Sincronizar PNCP Agora'}</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-navy-900/60 p-4 rounded-sm border border-slate-200 dark:border-navy-800 space-y-3">
                <span className="text-xs font-bold text-slate-950 dark:text-white uppercase block">
                  Ou Conectar Qualquer Outra API REST / Webservice Externo
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Insira a URL pública ou privada do Webservice da Prefeitura, TCE-PR ou ERP Municipal (Betha, IPM, Elotech, Governa). Os dados recebidos serão persistidos na tabela oficial do município.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">
                      Nome / Identificador da Fonte
                    </label>
                    <input
                      type="text"
                      value={apiNome}
                      onChange={e => setApiNome(e.target.value)}
                      placeholder="Ex: PNCP Oficial, ERP Betha Saúde, etc."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-900 dark:text-white focus:outline-none focus:border-navy-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">
                      Endpoint / URL da API (REST JSON)
                    </label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={e => setApiUrl(e.target.value)}
                      placeholder="https://api.orgao.gov.br/contratos"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-900 dark:text-white focus:outline-none focus:border-navy-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">
                      Token de Autenticação / Authorization Header (Opcional)
                    </label>
                    <input
                      type="text"
                      value={apiAuth}
                      onChange={e => setApiAuth(e.target.value)}
                      placeholder="Bearer seu_token_aqui ou Basic ..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-sm text-slate-900 dark:text-white focus:outline-none focus:border-navy-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConectarApi}
                    disabled={loadingApi || !apiUrl}
                    className="px-5 py-2.5 bg-[#0a1128] hover:bg-[#1a2a52] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingApi ? 'animate-spin' : ''}`} />
                    <span>{loadingApi ? 'Conectando e Importando...' : 'Conectar e Atualizar Painéis'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: PLANILHA */}
          {activeTab === 'planilha' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-sm p-6 text-center bg-slate-50 dark:bg-navy-900/40 space-y-3">
                <input
                  type="file"
                  ref={filePlanilhaRef}
                  onChange={handlePlanilhaChange}
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {filePlanilha ? filePlanilha.name : 'Selecione uma Planilha CSV ou TSV'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Colunas aceitas: numero, secretaria, empresa, objeto, valor_total, valor_liquidado, data_inicio, data_fim.
                  </p>
                </div>
                <button
                  onClick={() => filePlanilhaRef.current?.click()}
                  className="px-4 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-sm transition cursor-pointer"
                >
                  {filePlanilha ? 'Trocar Arquivo' : 'Buscar no Computador'}
                </button>
              </div>

              {previewPlanilha && previewPlanilha.valid && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                      ✓ Planilha Validada: {previewPlanilha.linhasValidas.length} contratos identificados
                    </span>
                    <button
                      onClick={salvarPlanilha}
                      disabled={salvandoPlanilha}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xs transition cursor-pointer shadow-xs"
                    >
                      {salvandoPlanilha ? 'Gravando no Banco...' : 'Confirmar e Cadastrar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: XML */}
          {activeTab === 'xml' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-sm p-6 text-center bg-slate-50 dark:bg-navy-900/40 space-y-3">
                <input
                  type="file"
                  ref={fileXmlRef}
                  onChange={handleXmlChange}
                  accept=".xml"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {fileXml ? fileXml.name : 'Selecione um Arquivo XML (TCE-PR, Siconfi ou NF-e)'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    O parser inteligente identificará as tags de contratos, fornecedores e liquidações.
                  </p>
                </div>
                <button
                  onClick={() => fileXmlRef.current?.click()}
                  className="px-4 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-sm transition cursor-pointer"
                >
                  {fileXml ? 'Trocar Arquivo XML' : 'Buscar Arquivo XML'}
                </button>
              </div>

              {previewXml && previewXml.valid && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">
                      ✓ XML Validado: {previewXml.totalContratos} contratos encontrados
                    </span>
                    <button
                      onClick={salvarXml}
                      disabled={salvandoXml}
                      className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-xs transition cursor-pointer shadow-xs"
                    >
                      {salvandoXml ? 'Gravando no Banco...' : 'Confirmar e Cadastrar XML'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
