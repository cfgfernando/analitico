import { useState, useEffect, useCallback } from 'react';
import {
  FiscalKPIs,
  RevenueSource,
  ExpenseNature,
  ExpenseFunction,
  LRFLimit,
  FundebData,
  FiscalAlert,
  EmendaParlamentar,
  ConvenioRecurso,
  ObraAraucaria,
  ObrasSummary,
  SiconfiApiStatus,
  ComparativeAnalysis,
} from '../types/fiscal';
import { buildComparativeAnalysis } from '../utils/comparative';
import api from '../api/client';

export interface FiscalDataHook {
  loading: boolean;
  error: string | null;
  summary: FiscalKPIs | null;
  receitas: RevenueSource[];
  porNatureza: ExpenseNature[];
  porFuncao: ExpenseFunction[];
  limites: LRFLimit[];
  captacao: {
    metaAnual: number;
    captadoAcumulado: number;
    percentualAtingimento: string;
    novasEmendas7Dias?: number;
    emendas: EmendaParlamentar[];
    convenios: ConvenioRecurso[];
  } | null;
  fundeb: FundebData | null;
  alerts: FiscalAlert[];
  obrasData: {
    obras: ObraAraucaria[];
    summary: ObrasSummary | null;
  };
  siconfiStatus: SiconfiApiStatus | null;
  comparativeData: ComparativeAnalysis | null;
  refetch: () => Promise<void>;
}

export function useFiscalData(
  tenantId: string,
  codigoIbge: string,
  ano: number = 2026,
  isComparativoAnual: boolean = false
): FiscalDataHook {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<FiscalKPIs | null>(null);
  const [receitas, setReceitas] = useState<RevenueSource[]>([]);
  const [porNatureza, setPorNatureza] = useState<ExpenseNature[]>([]);
  const [porFuncao, setPorFuncao] = useState<ExpenseFunction[]>([]);
  const [limites, setLimites] = useState<LRFLimit[]>([]);
  const [captacao, setCaptacao] = useState<FiscalDataHook['captacao']>(null);
  const [fundeb, setFundeb] = useState<FundebData | null>(null);
  const [alerts, setAlerts] = useState<FiscalAlert[]>([]);
  const [obrasData, setObrasData] = useState<FiscalDataHook['obrasData']>({
    obras: [],
    summary: null,
  });
  const [siconfiStatus, setSiconfiStatus] = useState<SiconfiApiStatus | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeAnalysis | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const safeTenantId = tenantId || 'tenant-araucaria';
    const safeIbge = codigoIbge || '4101804';
    const query = `?tenantId=${safeTenantId}&codigoIbge=${safeIbge}&ano=${ano}`;

    try {
      const [
        summaryRes,
        receitasRes,
        despesasRes,
        lrfRes,
        captacaoRes,
        fundebRes,
        alertasRes,
        obrasRes,
        siconfiRes,
      ] = await Promise.all([
        api.get<any>(`/api/fiscal/summary${query}`).catch(() => null),
        api.get<any>(`/api/fiscal/receitas${query}`).catch(() => []),
        api.get<any>(`/api/fiscal/despesas${query}`).catch(() => ({ porNatureza: [], porFuncao: [] })),
        api.get<any>(`/api/fiscal/lrf${query}`).catch(() => []),
        api.get<any>(`/api/fiscal/captacao${query}`).catch(() => null),
        api.get<any>(`/api/fiscal/fundeb${query}`).catch(() => null),
        api.get<any>(`/api/fiscal/alertas${query}`).catch(() => []),
        api.get<any>(`/api/fiscal/obras${query}`).catch(() => ({ obras: [], summary: null })),
        api.get<any>(`/api/siconfi/status${query}`).catch(() => null),
      ]);

      if (summaryRes) setSummary(summaryRes);
      if (receitasRes) {
        setReceitas(Array.isArray(receitasRes) ? receitasRes : (receitasRes.receitas || []));
      }
      if (despesasRes) {
        setPorNatureza(Array.isArray(despesasRes.porNatureza) ? despesasRes.porNatureza : (Array.isArray(despesasRes) ? despesasRes : []));
        setPorFuncao(Array.isArray(despesasRes.porFuncao) ? despesasRes.porFuncao : []);
      }
      if (lrfRes) {
        setLimites(Array.isArray(lrfRes) ? lrfRes : (lrfRes.limites || []));
      }
      if (captacaoRes) setCaptacao(captacaoRes);
      if (fundebRes) setFundeb(fundebRes);
      if (alertasRes) {
        setAlerts(Array.isArray(alertasRes) ? alertasRes : (alertasRes.alertas || []));
      }
      if (obrasRes) setObrasData(obrasRes);
      if (siconfiRes) setSiconfiStatus(siconfiRes);

      if (isComparativoAnual) {
        const [prevSummary, prevReceitas, prevDespesas] = await Promise.all([
          api.get<any>(`/api/fiscal/summary?tenantId=${safeTenantId}&codigoIbge=${safeIbge}&ano=${ano - 1}`).catch(() => null),
          api.get<any>(`/api/fiscal/receitas?tenantId=${safeTenantId}&codigoIbge=${safeIbge}&ano=${ano - 1}`).catch(() => []),
          api.get<any>(`/api/fiscal/despesas?tenantId=${safeTenantId}&codigoIbge=${safeIbge}&ano=${ano - 1}`).catch(() => ({ porNatureza: [], porFuncao: [] })),
        ]);

        if (summaryRes && prevSummary) {
          const currRecArray = Array.isArray(receitasRes) ? receitasRes : (receitasRes?.receitas || []);
          const prevRecArray = Array.isArray(prevReceitas) ? prevReceitas : (prevReceitas?.receitas || []);
          const currNatArray = Array.isArray(despesasRes?.porNatureza) ? despesasRes.porNatureza : (Array.isArray(despesasRes) ? despesasRes : []);
          const prevNatArray = Array.isArray(prevDespesas?.porNatureza) ? prevDespesas.porNatureza : (Array.isArray(prevDespesas) ? prevDespesas : []);
          const currFuncArray = Array.isArray(despesasRes?.porFuncao) ? despesasRes.porFuncao : [];
          const prevFuncArray = Array.isArray(prevDespesas?.porFuncao) ? prevDespesas.porFuncao : [];

          const comp = buildComparativeAnalysis(
            ano,
            summaryRes,
            prevSummary,
            currRecArray,
            prevRecArray,
            currNatArray,
            prevNatArray,
            currFuncArray,
            prevFuncArray
          );
          setComparativeData(comp);
        }
      } else {
        setComparativeData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar indicadores fiscais.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, codigoIbge, ano, isComparativoAnual]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    summary,
    receitas,
    porNatureza,
    porFuncao,
    limites,
    captacao,
    fundeb,
    alerts,
    obrasData,
    siconfiStatus,
    comparativeData,
    refetch: loadData,
  };
}
