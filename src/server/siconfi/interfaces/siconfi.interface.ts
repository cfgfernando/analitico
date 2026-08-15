export interface SiconfiRawItem {
  exercicio: number;
  periodo: number;
  periodicidade: string;
  anexo: string;
  rotulo?: string;
  coluna?: string;
  cod_conta: string;
  conta: string;
  valor: number;
  populacao?: number;
  poder?: string;
}

export interface SiconfiApiResponse {
  items: SiconfiRawItem[];
  hasMore: boolean;
  limit: number;
  offset: number;
  count: number;
}

export interface SiconfiSyncResult {
  tenantId: string;
  codigoIbge: string;
  ano: number;
  status: 'SUCESSO' | 'ERRO' | 'PARCIAL';
  totalRegistros: number;
  anexosProcessados: string[];
  detalhes: string;
  timestamp: string;
}
