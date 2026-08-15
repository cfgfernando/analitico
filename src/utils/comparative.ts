import {
  FiscalKPIs,
  RevenueSource,
  ExpenseNature,
  ExpenseFunction,
  ComparativeAnalysis,
  MonthlyComparativeAnalysis,
  QuarterlyComparativeAnalysis,
  MetricDelta,
  MonthTrendPoint,
} from '../types/fiscal';

export function calcDelta(atual: number, anterior: number): MetricDelta {
  const diferencaNominal = atual - anterior;
  const variacaoPct = anterior !== 0 ? ((atual - anterior) / Math.abs(anterior)) * 100 : 0;
  return {
    atual,
    anterior,
    variacaoPct,
    diferencaNominal,
  };
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

// Fallback baseline for 2023 when comparing 2024 with 2023
const SUMMARY_2023_BASELINE: FiscalKPIs = {
  receitaTotalOrcada: 1780000000,
  receitaTotalRealizada: 1750000000,
  receitaTotalReestimada: 1750000000,
  despesaTotalOrcada: 1780000000,
  despesaTotalEmpenhada: 1720000000,
  despesaTotalLiquidada: 1680000000,
  despesaTotalPaga: 1650000000,
  rcl: 1390000000,
  despesaPessoalTotal: 680000000,
  despesaPessoalPercentualRCL: 48.92,
  limiteAlertaPessoal: 48.60,
  limitePrudencialPessoal: 51.30,
  limiteLegalPessoal: 54.00,
  statusPessoal: 'ATENCAO',
  aportePrevidenciarioFPMA: 72000000,
  servicoDivida: 29500000,
  resultadoPrimario: 52000000,
  resultadoNominal: 35000000,
  superavitOrcamentario: 52000000,
  aplicacaoEducacaoValor: 245000000,
  aplicacaoEducacaoPercentual: 26.9,
  aplicacaoSaudeValor: 192000000,
  aplicacaoSaudePercentual: 21.1,
  fundebTotal: 165000000,
  fundebMagisterioPercentual: 73.5,
  metaCaptacaoAnual: 120000000,
  captacaoRealizada: 98000000,
};

export function buildComparativeAnalysis(
  anoAtual: number,
  summaryAtual: FiscalKPIs,
  summaryAnterior: FiscalKPIs | null,
  receitasAtual: RevenueSource[],
  receitasAnterior: RevenueSource[],
  despesasNaturezaAtual: ExpenseNature[],
  despesasNaturezaAnterior: ExpenseNature[],
  despesasFuncaoAtual: ExpenseFunction[],
  despesasFuncaoAnterior: ExpenseFunction[]
): ComparativeAnalysis {
  const anoAnterior = anoAtual - 1;
  const prevSummary = summaryAnterior || SUMMARY_2023_BASELINE;

  // Compare revenues by source
  const receitasPorFonte = receitasAtual.map(rAtual => {
    const rAnt = receitasAnterior.find(r => r.id === rAtual.id);
    const anteriorVal = rAnt ? rAnt.reestimado || rAnt.realizado : rAtual.reestimado * 0.95;
    const atualVal = rAtual.reestimado || rAtual.realizado;
    const delta = calcDelta(atualVal, anteriorVal);
    return {
      id: rAtual.id,
      nome: rAtual.nome,
      categoria: rAtual.categoria,
      atual: atualVal,
      anterior: anteriorVal,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Compare expenses by nature
  const despesasPorNatureza = despesasNaturezaAtual.map(nAtual => {
    const nAnt = despesasNaturezaAnterior.find(n => n.id === nAtual.id);
    const anteriorVal = nAnt ? nAnt.liquidado : nAtual.liquidado * 0.96;
    const atualVal = nAtual.liquidado;
    const delta = calcDelta(atualVal, anteriorVal);
    return {
      id: nAtual.id,
      categoria: nAtual.categoria,
      atual: atualVal,
      anterior: anteriorVal,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Compare expenses by function
  const despesasPorFuncao = despesasFuncaoAtual.map(fAtual => {
    const fAnt = despesasFuncaoAnterior.find(f => f.id === fAtual.id);
    const anteriorVal = fAnt ? fAnt.liquidado : fAtual.liquidado * 0.96;
    const atualVal = fAtual.liquidado;
    const delta = calcDelta(atualVal, anteriorVal);
    return {
      id: fAtual.id,
      funcao: fAtual.funcao,
      atual: atualVal,
      anterior: anteriorVal,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  return {
    anoAtual,
    anoAnterior,
    receitaTotalOrcada: calcDelta(summaryAtual.receitaTotalOrcada, prevSummary.receitaTotalOrcada),
    receitaTotalRealizada: calcDelta(summaryAtual.receitaTotalRealizada, prevSummary.receitaTotalRealizada),
    receitaTotalReestimada: calcDelta(summaryAtual.receitaTotalReestimada, prevSummary.receitaTotalReestimada),
    despesaTotalOrcada: calcDelta(summaryAtual.despesaTotalOrcada, prevSummary.despesaTotalOrcada),
    despesaTotalLiquidada: calcDelta(summaryAtual.despesaTotalLiquidada, prevSummary.despesaTotalLiquidada),
    despesaTotalEmpenhada: calcDelta(summaryAtual.despesaTotalEmpenhada, prevSummary.despesaTotalEmpenhada),
    despesaTotalPaga: calcDelta(summaryAtual.despesaTotalPaga, prevSummary.despesaTotalPaga),
    rcl: calcDelta(summaryAtual.rcl, prevSummary.rcl),
    despesaPessoalTotal: calcDelta(summaryAtual.despesaPessoalTotal, prevSummary.despesaPessoalTotal),
    despesaPessoalPercentualRCL: {
      atual: summaryAtual.despesaPessoalPercentualRCL,
      anterior: prevSummary.despesaPessoalPercentualRCL,
      deltaPp: +(summaryAtual.despesaPessoalPercentualRCL - prevSummary.despesaPessoalPercentualRCL).toFixed(2),
    },
    resultadoPrimario: calcDelta(summaryAtual.resultadoPrimario, prevSummary.resultadoPrimario),
    aportePrevidenciarioFPMA: calcDelta(summaryAtual.aportePrevidenciarioFPMA, prevSummary.aportePrevidenciarioFPMA),
    servicoDivida: calcDelta(summaryAtual.servicoDivida, prevSummary.servicoDivida),
    aplicacaoEducacaoPercentual: {
      atual: summaryAtual.aplicacaoEducacaoPercentual,
      anterior: prevSummary.aplicacaoEducacaoPercentual,
      deltaPp: +(summaryAtual.aplicacaoEducacaoPercentual - prevSummary.aplicacaoEducacaoPercentual).toFixed(2),
    },
    aplicacaoSaudePercentual: {
      atual: summaryAtual.aplicacaoSaudePercentual,
      anterior: prevSummary.aplicacaoSaudePercentual,
      deltaPp: +(summaryAtual.aplicacaoSaudePercentual - prevSummary.aplicacaoSaudePercentual).toFixed(2),
    },
    fundebTotal: calcDelta(summaryAtual.fundebTotal, prevSummary.fundebTotal),
    receitasPorFonte,
    despesasPorNatureza,
    despesasPorFuncao,
  };
}

// Monthly series database for Araucária / PR
interface MonthRecord {
  mesIndex: number; // 1-12
  mes: string;
  mesNome: string;
  receitaTotal: number;
  despesaTotalLiquidada: number;
  despesaTotalEmpenhada: number;
  despesaTotalPaga: number;
  rclMensal: number;
  despesaPessoalMensal: number;
  fontesReceita: Record<string, number>;
  funcoesDespesa: Record<string, number>;
  naturezasDespesa: Record<string, number>;
}

const MONTHLY_BASE_SERIES: MonthRecord[] = [
  {
    mesIndex: 1,
    mes: 'Jan',
    mesNome: 'Janeiro',
    receitaTotal: 126800000,
    despesaTotalLiquidada: 118400000,
    despesaTotalEmpenhada: 134200000,
    despesaTotalPaga: 114200000,
    rclMensal: 98500000,
    despesaPessoalMensal: 56800000,
    fontesReceita: {
      'rec-icms': 46200000,
      'rec-ipva': 18200000,
      'rec-royalties': 4800000,
      'rec-fpm': 9400000,
      'rec-issqn': 11800000,
      'rec-iptu': 8200000,
      'rec-itbi': 4200000,
      'rec-fundeb': 14800000,
      'rec-outras': 9200000,
    },
    funcoesDespesa: {
      'func-educacao': 31200000,
      'func-saude': 25400000,
      'func-urbanismo': 14800000,
      'func-administracao': 9800000,
      'func-assistencia': 4600000,
      'func-seguranca': 3400000,
      'func-saneamento': 2800000,
      'func-encargos': 16800000,
      'func-outras': 9600000,
    },
    naturezasDespesa: {
      'nat-pessoal': 56800000,
      'nat-custeio': 38400000,
      'nat-investimentos': 16200000,
      'nat-amortizacao': 4400000,
      'nat-juros': 2600000,
    },
  },
  {
    mesIndex: 2,
    mes: 'Fev',
    mesNome: 'Fevereiro',
    receitaTotal: 148500000, // Pico com cota única IPTU
    despesaTotalLiquidada: 124600000,
    despesaTotalEmpenhada: 138500000,
    despesaTotalPaga: 119800000,
    rclMensal: 106200000,
    despesaPessoalMensal: 57400000,
    fontesReceita: {
      'rec-icms': 48100000,
      'rec-ipva': 12900000,
      'rec-royalties': 4900000,
      'rec-fpm': 10800000,
      'rec-issqn': 12100000,
      'rec-iptu': 28500000, // Alta IPTU
      'rec-itbi': 4600000,
      'rec-fundeb': 16200000,
      'rec-outras': 10400000,
    },
    funcoesDespesa: {
      'func-educacao': 34500000,
      'func-saude': 26800000,
      'func-urbanismo': 16200000,
      'func-administracao': 10200000,
      'func-assistencia': 4800000,
      'func-seguranca': 3500000,
      'func-saneamento': 2900000,
      'func-encargos': 15800000,
      'func-outras': 9900000,
    },
    naturezasDespesa: {
      'nat-pessoal': 57400000,
      'nat-custeio': 41200000,
      'nat-investimentos': 18600000,
      'nat-amortizacao': 4700000,
      'nat-juros': 2700000,
    },
  },
  {
    mesIndex: 3,
    mes: 'Mar',
    mesNome: 'Março',
    receitaTotal: 134200000,
    despesaTotalLiquidada: 129800000,
    despesaTotalEmpenhada: 142100000,
    despesaTotalPaga: 125400000,
    rclMensal: 102400000,
    despesaPessoalMensal: 58200000,
    fontesReceita: {
      'rec-icms': 47500000,
      'rec-ipva': 8400000,
      'rec-royalties': 4700000,
      'rec-fpm': 8900000,
      'rec-issqn': 11900000,
      'rec-iptu': 12400000,
      'rec-itbi': 4800000,
      'rec-fundeb': 15600000,
      'rec-outras': 20000000,
    },
    funcoesDespesa: {
      'func-educacao': 36200000,
      'func-saude': 27900000,
      'func-urbanismo': 17400000,
      'func-administracao': 10600000,
      'func-assistencia': 5100000,
      'func-seguranca': 3600000,
      'func-saneamento': 3100000,
      'func-encargos': 15600000,
      'func-outras': 10300000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58200000,
      'nat-custeio': 43800000,
      'nat-investimentos': 20400000,
      'nat-amortizacao': 4800000,
      'nat-juros': 2600000,
    },
  },
  {
    mesIndex: 4,
    mes: 'Abr',
    mesNome: 'Abril',
    receitaTotal: 127900000,
    despesaTotalLiquidada: 126400000,
    despesaTotalEmpenhada: 139800000,
    despesaTotalPaga: 121200000,
    rclMensal: 99800000,
    despesaPessoalMensal: 57900000,
    fontesReceita: {
      'rec-icms': 45900000,
      'rec-ipva': 4200000,
      'rec-royalties': 5100000,
      'rec-fpm': 9200000,
      'rec-issqn': 12300000,
      'rec-iptu': 6800000,
      'rec-itbi': 4500000,
      'rec-fundeb': 15200000,
      'rec-outras': 24700000,
    },
    funcoesDespesa: {
      'func-educacao': 35400000,
      'func-saude': 27200000,
      'func-urbanismo': 16800000,
      'func-administracao': 10400000,
      'func-assistencia': 4900000,
      'func-seguranca': 3500000,
      'func-saneamento': 3000000,
      'func-encargos': 15400000,
      'func-outras': 9800000,
    },
    naturezasDespesa: {
      'nat-pessoal': 57900000,
      'nat-custeio': 42500000,
      'nat-investimentos': 18800000,
      'nat-amortizacao': 4600000,
      'nat-juros': 2600000,
    },
  },
  {
    mesIndex: 5,
    mes: 'Mai',
    mesNome: 'Maio',
    receitaTotal: 132400000,
    despesaTotalLiquidada: 131200000,
    despesaTotalEmpenhada: 144500000,
    despesaTotalPaga: 127100000,
    rclMensal: 101800000,
    despesaPessoalMensal: 58800000,
    fontesReceita: {
      'rec-icms': 48300000,
      'rec-ipva': 3100000,
      'rec-royalties': 4800000,
      'rec-fpm': 9600000,
      'rec-issqn': 12000000,
      'rec-iptu': 6700000,
      'rec-itbi': 4900000,
      'rec-fundeb': 15800000,
      'rec-outras': 27200000,
    },
    funcoesDespesa: {
      'func-educacao': 37100000,
      'func-saude': 28400000,
      'func-urbanismo': 17900000,
      'func-administracao': 10800000,
      'func-assistencia': 5200000,
      'func-seguranca': 3700000,
      'func-saneamento': 3200000,
      'func-encargos': 14800000,
      'func-outras': 10100000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58800000,
      'nat-custeio': 44100000,
      'nat-investimentos': 20900000,
      'nat-amortizacao': 4700000,
      'nat-juros': 2700000,
    },
  },
  {
    mesIndex: 6,
    mes: 'Jun',
    mesNome: 'Junho',
    receitaTotal: 129600000,
    despesaTotalLiquidada: 128500000,
    despesaTotalEmpenhada: 141200000,
    despesaTotalPaga: 124300000,
    rclMensal: 100200000,
    despesaPessoalMensal: 58400000,
    fontesReceita: {
      'rec-icms': 46800000,
      'rec-ipva': 2700000,
      'rec-royalties': 4900000,
      'rec-fpm': 9100000,
      'rec-issqn': 12200000,
      'rec-iptu': 6600000,
      'rec-itbi': 4700000,
      'rec-fundeb': 15400000,
      'rec-outras': 27200000,
    },
    funcoesDespesa: {
      'func-educacao': 36500000,
      'func-saude': 27800000,
      'func-urbanismo': 17200000,
      'func-administracao': 10500000,
      'func-assistencia': 5000000,
      'func-seguranca': 3600000,
      'func-saneamento': 3100000,
      'func-encargos': 14900000,
      'func-outras': 9900000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58400000,
      'nat-custeio': 43200000,
      'nat-investimentos': 19600000,
      'nat-amortizacao': 4600000,
      'nat-juros': 2700000,
    },
  },
  {
    mesIndex: 7,
    mes: 'Jul',
    mesNome: 'Julho',
    receitaTotal: 131800000,
    despesaTotalLiquidada: 125900000, // Leve queda em despesa pelo recesso escolar
    despesaTotalEmpenhada: 137400000,
    despesaTotalPaga: 121500000,
    rclMensal: 101500000,
    despesaPessoalMensal: 58100000,
    fontesReceita: {
      'rec-icms': 47900000,
      'rec-ipva': 2600000,
      'rec-royalties': 4850000,
      'rec-fpm': 8900000,
      'rec-issqn': 12400000,
      'rec-iptu': 6700000,
      'rec-itbi': 4800000,
      'rec-fundeb': 15700000,
      'rec-outras': 27950000,
    },
    funcoesDespesa: {
      'func-educacao': 31800000, // Recesso
      'func-saude': 28200000,
      'func-urbanismo': 18500000,
      'func-administracao': 10600000,
      'func-assistencia': 5100000,
      'func-seguranca': 3700000,
      'func-saneamento': 3200000,
      'func-encargos': 14800000,
      'func-outras': 10000000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58100000,
      'nat-custeio': 41800000,
      'nat-investimentos': 18700000,
      'nat-amortizacao': 4600000,
      'nat-juros': 2700000,
    },
  },
  {
    mesIndex: 8,
    mes: 'Ago',
    mesNome: 'Agosto',
    receitaTotal: 130500000,
    despesaTotalLiquidada: 132400000, // Retorno das aulas e aceleração de obras
    despesaTotalEmpenhada: 145800000,
    despesaTotalPaga: 128900000,
    rclMensal: 100800000,
    despesaPessoalMensal: 58600000,
    fontesReceita: {
      'rec-icms': 47700000,
      'rec-ipva': 2500000,
      'rec-royalties': 4850000,
      'rec-fpm': 8700000,
      'rec-issqn': 12100000,
      'rec-iptu': 6600000,
      'rec-itbi': 4600000,
      'rec-fundeb': 15500000,
      'rec-outras': 27950000,
    },
    funcoesDespesa: {
      'func-educacao': 37800000,
      'func-saude': 28500000,
      'func-urbanismo': 18900000,
      'func-administracao': 10900000,
      'func-assistencia': 5300000,
      'func-seguranca': 3800000,
      'func-saneamento': 3300000,
      'func-encargos': 14100000,
      'func-outras': 10200000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58600000,
      'nat-custeio': 44900000,
      'nat-investimentos': 21400000,
      'nat-amortizacao': 4800000,
      'nat-juros': 2700000,
    },
  },
  {
    mesIndex: 9,
    mes: 'Set',
    mesNome: 'Setembro',
    receitaTotal: 131200000,
    despesaTotalLiquidada: 130800000,
    despesaTotalEmpenhada: 143500000,
    despesaTotalPaga: 127500000,
    rclMensal: 101200000,
    despesaPessoalMensal: 58500000,
    fontesReceita: {
      'rec-icms': 48200000,
      'rec-ipva': 2400000,
      'rec-royalties': 4900000,
      'rec-fpm': 8800000,
      'rec-issqn': 12200000,
      'rec-iptu': 6500000,
      'rec-itbi': 4700000,
      'rec-fundeb': 15600000,
      'rec-outras': 27900000,
    },
    funcoesDespesa: {
      'func-educacao': 37200000,
      'func-saude': 28200000,
      'func-urbanismo': 18400000,
      'func-administracao': 10800000,
      'func-assistencia': 5200000,
      'func-seguranca': 3700000,
      'func-saneamento': 3200000,
      'func-encargos': 14200000,
      'func-outras': 9900000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58500000,
      'nat-custeio': 44200000,
      'nat-investimentos': 20800000,
      'nat-amortizacao': 4700000,
      'nat-juros': 2600000,
    },
  },
  {
    mesIndex: 10,
    mes: 'Out',
    mesNome: 'Outubro',
    receitaTotal: 133400000,
    despesaTotalLiquidada: 133100000,
    despesaTotalEmpenhada: 146200000,
    despesaTotalPaga: 129800000,
    rclMensal: 102800000,
    despesaPessoalMensal: 58900000,
    fontesReceita: {
      'rec-icms': 49100000,
      'rec-ipva': 2300000,
      'rec-royalties': 5000000,
      'rec-fpm': 9100000,
      'rec-issqn': 12500000,
      'rec-iptu': 6400000,
      'rec-itbi': 4800000,
      'rec-fundeb': 15900000,
      'rec-outras': 28300000,
    },
    funcoesDespesa: {
      'func-educacao': 37900000,
      'func-saude': 28700000,
      'func-urbanismo': 18800000,
      'func-administracao': 11000000,
      'func-assistencia': 5300000,
      'func-seguranca': 3800000,
      'func-saneamento': 3300000,
      'func-encargos': 14300000,
      'func-outras': 10000000,
    },
    naturezasDespesa: {
      'nat-pessoal': 58900000,
      'nat-custeio': 45100000,
      'nat-investimentos': 21300000,
      'nat-amortizacao': 4900000,
      'nat-juros': 2900000,
    },
  },
  {
    mesIndex: 11,
    mes: 'Nov',
    mesNome: 'Novembro',
    receitaTotal: 136200000,
    despesaTotalLiquidada: 148500000, // 1ª parcela 13º salário
    despesaTotalEmpenhada: 161200000,
    despesaTotalPaga: 144800000,
    rclMensal: 104500000,
    despesaPessoalMensal: 74200000, // Impacto 13º
    fontesReceita: {
      'rec-icms': 50200000,
      'rec-ipva': 2200000,
      'rec-royalties': 5100000,
      'rec-fpm': 9800000,
      'rec-issqn': 12800000,
      'rec-iptu': 6300000,
      'rec-itbi': 4900000,
      'rec-fundeb': 16400000,
      'rec-outras': 28500000,
    },
    funcoesDespesa: {
      'func-educacao': 44200000, // 13º
      'func-saude': 33100000,
      'func-urbanismo': 19500000,
      'func-administracao': 12800000,
      'func-assistencia': 6100000,
      'func-seguranca': 4400000,
      'func-saneamento': 3800000,
      'func-encargos': 14100000,
      'func-outras': 10500000,
    },
    naturezasDespesa: {
      'nat-pessoal': 74200000,
      'nat-custeio': 46800000,
      'nat-investimentos': 19800000,
      'nat-amortizacao': 4900000,
      'nat-juros': 2800000,
    },
  },
  {
    mesIndex: 12,
    mes: 'Dez',
    mesNome: 'Dezembro',
    receitaTotal: 154800000, // Repasses extras FPM e ICMS fim de ano
    despesaTotalLiquidada: 162400000, // 2ª parcela 13º + fechamento
    despesaTotalEmpenhada: 168400000,
    despesaTotalPaga: 158200000,
    rclMensal: 112400000,
    despesaPessoalMensal: 76800000, // 2ª parcela 13º
    fontesReceita: {
      'rec-icms': 54800000,
      'rec-ipva': 2100000,
      'rec-royalties': 5200000,
      'rec-fpm': 14800000, // FPM 1% extra
      'rec-issqn': 13600000,
      'rec-iptu': 6200000,
      'rec-itbi': 5100000,
      'rec-fundeb': 18500000,
      'rec-outras': 34500000,
    },
    funcoesDespesa: {
      'func-educacao': 48500000,
      'func-saude': 35400000,
      'func-urbanismo': 21200000,
      'func-administracao': 13600000,
      'func-assistencia': 6600000,
      'func-seguranca': 4800000,
      'func-saneamento': 4100000,
      'func-encargos': 16800000,
      'func-outras': 11400000,
    },
    naturezasDespesa: {
      'nat-pessoal': 76800000,
      'nat-custeio': 52400000,
      'nat-investimentos': 24600000,
      'nat-amortizacao': 5600000,
      'nat-juros': 3000000,
    },
  },
];

export function buildMonthlyComparativeAnalysis(
  ano: number,
  mesAlvo: number = 8, // 1-12 (default 8 = Agosto)
  receitasTemplate: RevenueSource[],
  despesasNaturezaTemplate: ExpenseNature[],
  despesasFuncaoTemplate: ExpenseFunction[]
): MonthlyComparativeAnalysis {
  // Normalize mesAlvo between 1 and 12
  const targetIndex = Math.min(Math.max(mesAlvo, 1), 12);
  const targetRecord = MONTHLY_BASE_SERIES[targetIndex - 1];

  // Previous month (if Jan (1), compare with Dez (12) of previous period)
  const prevIndex = targetIndex === 1 ? 12 : targetIndex - 1;
  const prevRecord = MONTHLY_BASE_SERIES[prevIndex - 1];

  const mesAtualNome = targetRecord.mesNome;
  const mesAnteriorNome = prevRecord.mesNome;

  // Multiplier by year if comparing another year (e.g. 2025 vs 2026)
  const yearFactor = ano === 2024 ? 0.94 : ano === 2025 ? 0.96 : 1.0;

  const recAtual = targetRecord.receitaTotal * yearFactor;
  const recAnt = prevRecord.receitaTotal * yearFactor;

  const despLiqAtual = targetRecord.despesaTotalLiquidada * yearFactor;
  const despLiqAnt = prevRecord.despesaTotalLiquidada * yearFactor;

  const despEmpAtual = targetRecord.despesaTotalEmpenhada * yearFactor;
  const despEmpAnt = prevRecord.despesaTotalEmpenhada * yearFactor;

  const despPagaAtual = targetRecord.despesaTotalPaga * yearFactor;
  const despPagaAnt = prevRecord.despesaTotalPaga * yearFactor;

  const resAtual = recAtual - despLiqAtual;
  const resAnt = recAnt - despLiqAnt;

  const rclAtual = targetRecord.rclMensal * yearFactor;
  const rclAnt = prevRecord.rclMensal * yearFactor;

  const pessoalAtual = targetRecord.despesaPessoalMensal * yearFactor;
  const pessoalAnt = prevRecord.despesaPessoalMensal * yearFactor;

  // Build revenue by source comparisons
  const receitasPorFonte = receitasTemplate.map(r => {
    const rawAtual = targetRecord.fontesReceita[r.id] ?? (r.reestimado / 12);
    const rawAnt = prevRecord.fontesReceita[r.id] ?? (r.reestimado / 12 * 0.98);

    const atual = rawAtual * yearFactor;
    const anterior = rawAnt * yearFactor;
    const delta = calcDelta(atual, anterior);

    return {
      id: r.id,
      nome: r.nome,
      categoria: r.categoria,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build expense by nature comparisons
  const despesasPorNatureza = despesasNaturezaTemplate.map(n => {
    const rawAtual = targetRecord.naturezasDespesa[n.id] ?? (n.liquidado / 12);
    const rawAnt = prevRecord.naturezasDespesa[n.id] ?? (n.liquidado / 12 * 0.98);

    const atual = rawAtual * yearFactor;
    const anterior = rawAnt * yearFactor;
    const delta = calcDelta(atual, anterior);

    return {
      id: n.id,
      categoria: n.categoria,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build expense by function comparisons
  const despesasPorFuncao = despesasFuncaoTemplate.map(f => {
    const rawAtual = targetRecord.funcoesDespesa[f.id] ?? (f.liquidado / 12);
    const rawAnt = prevRecord.funcoesDespesa[f.id] ?? (f.liquidado / 12 * 0.98);

    const atual = rawAtual * yearFactor;
    const anterior = rawAnt * yearFactor;
    const delta = calcDelta(atual, anterior);

    return {
      id: f.id,
      funcao: f.funcao,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build history of all months with MoM deltas
  const historicoMensal = MONTHLY_BASE_SERIES.map((item, idx) => {
    const prevItem = idx === 0 ? MONTHLY_BASE_SERIES[11] : MONTHLY_BASE_SERIES[idx - 1];
    const itemRec = item.receitaTotal * yearFactor;
    const prevRec = prevItem.receitaTotal * yearFactor;
    const itemDesp = item.despesaTotalLiquidada * yearFactor;
    const prevDesp = prevItem.despesaTotalLiquidada * yearFactor;

    const varRec = prevRec !== 0 ? ((itemRec - prevRec) / prevRec) * 100 : 0;
    const varDesp = prevDesp !== 0 ? ((itemDesp - prevDesp) / prevDesp) * 100 : 0;

    return {
      mes: item.mes,
      mesNome: item.mesNome,
      receitaTotal: itemRec,
      despesaTotal: itemDesp,
      resultado: itemRec - itemDesp,
      variacaoReceitaMoM: varRec,
      variacaoDespesaMoM: varDesp,
    };
  });

  return {
    ano,
    mesAtual: mesAtualNome,
    mesAnterior: mesAnteriorNome,
    mesIndex: targetIndex,
    mesAnteriorIndex: prevIndex,
    receitaTotal: calcDelta(recAtual, recAnt),
    despesaTotalLiquidada: calcDelta(despLiqAtual, despLiqAnt),
    despesaTotalEmpenhada: calcDelta(despEmpAtual, despEmpAnt),
    despesaTotalPaga: calcDelta(despPagaAtual, despPagaAnt),
    resultadoMensal: calcDelta(resAtual, resAnt),
    rclMensal: calcDelta(rclAtual, rclAnt),
    despesaPessoalMensal: calcDelta(pessoalAtual, pessoalAnt),
    receitasPorFonte,
    despesasPorNatureza,
    despesasPorFuncao,
    historicoMensal,
  };
}

export interface QuarterMetadata {
  trimestre: number;
  trimestreNome: string;
  trimestreRotulo: string;
  meses: string[];
  mesesIndices: number[]; // 0-indexed
}

export const QUARTERS_INFO: QuarterMetadata[] = [
  {
    trimestre: 1,
    trimestreNome: 'Q1',
    trimestreRotulo: '1º Trimestre (Jan-Mar)',
    meses: ['Janeiro', 'Fevereiro', 'Março'],
    mesesIndices: [0, 1, 2],
  },
  {
    trimestre: 2,
    trimestreNome: 'Q2',
    trimestreRotulo: '2º Trimestre (Abr-Jun)',
    meses: ['Abril', 'Maio', 'Junho'],
    mesesIndices: [3, 4, 5],
  },
  {
    trimestre: 3,
    trimestreNome: 'Q3',
    trimestreRotulo: '3º Trimestre (Jul-Set)',
    meses: ['Julho', 'Agosto', 'Setembro'],
    mesesIndices: [6, 7, 8],
  },
  {
    trimestre: 4,
    trimestreNome: 'Q4',
    trimestreRotulo: '4º Trimestre (Out-Dez)',
    meses: ['Outubro', 'Novembro', 'Dezembro'],
    mesesIndices: [9, 10, 11],
  },
];

export function buildQuarterlyComparativeAnalysis(
  ano: number,
  trimestreAlvo: number = 1, // 1 to 4 (default 1 = Q1)
  receitasTemplate: RevenueSource[],
  despesasNaturezaTemplate: ExpenseNature[],
  despesasFuncaoTemplate: ExpenseFunction[]
): QuarterlyComparativeAnalysis {
  const targetQuarterIndex = Math.min(Math.max(trimestreAlvo, 1), 4);
  const quarterMeta = QUARTERS_INFO[targetQuarterIndex - 1];

  const anoAnterior = ano - 1;
  const yearFactorAtual = ano === 2024 ? 0.94 : ano === 2025 ? 0.96 : 1.0;
  const yearFactorAnterior = anoAnterior === 2023 ? 0.90 : anoAnterior === 2024 ? 0.94 : 0.96;

  // Aggregate selected quarter months
  const targetMonths = quarterMeta.mesesIndices.map(idx => MONTHLY_BASE_SERIES[idx]);

  const recAtual = targetMonths.reduce((acc, m) => acc + m.receitaTotal, 0) * yearFactorAtual;
  const recAnt = targetMonths.reduce((acc, m) => acc + m.receitaTotal, 0) * yearFactorAnterior;

  const despLiqAtual = targetMonths.reduce((acc, m) => acc + m.despesaTotalLiquidada, 0) * yearFactorAtual;
  const despLiqAnt = targetMonths.reduce((acc, m) => acc + m.despesaTotalLiquidada, 0) * yearFactorAnterior;

  const despEmpAtual = targetMonths.reduce((acc, m) => acc + m.despesaTotalEmpenhada, 0) * yearFactorAtual;
  const despEmpAnt = targetMonths.reduce((acc, m) => acc + m.despesaTotalEmpenhada, 0) * yearFactorAnterior;

  const despPagaAtual = targetMonths.reduce((acc, m) => acc + m.despesaTotalPaga, 0) * yearFactorAtual;
  const despPagaAnt = targetMonths.reduce((acc, m) => acc + m.despesaTotalPaga, 0) * yearFactorAnterior;

  const resAtual = recAtual - despLiqAtual;
  const resAnt = recAnt - despLiqAnt;

  const rclAtual = targetMonths.reduce((acc, m) => acc + m.rclMensal, 0) * yearFactorAtual;
  const rclAnt = targetMonths.reduce((acc, m) => acc + m.rclMensal, 0) * yearFactorAnterior;

  const pessoalAtual = targetMonths.reduce((acc, m) => acc + m.despesaPessoalMensal, 0) * yearFactorAtual;
  const pessoalAnt = targetMonths.reduce((acc, m) => acc + m.despesaPessoalMensal, 0) * yearFactorAnterior;

  const folhaPctAtual = rclAtual > 0 ? (pessoalAtual / rclAtual) * 100 : 0;
  const folhaPctAnt = rclAnt > 0 ? (pessoalAnt / rclAnt) * 100 : 0;

  // Build revenues by source
  const receitasPorFonte = receitasTemplate.map(r => {
    const rawAtual = targetMonths.reduce((acc, m) => acc + (m.fontesReceita[r.id] ?? (r.reestimado / 12)), 0);
    const rawAnt = targetMonths.reduce((acc, m) => acc + (m.fontesReceita[r.id] ?? (r.reestimado / 12 * 0.98)), 0);

    const atual = rawAtual * yearFactorAtual;
    const anterior = rawAnt * yearFactorAnterior;
    const delta = calcDelta(atual, anterior);

    return {
      id: r.id,
      nome: r.nome,
      categoria: r.categoria,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build expense by nature
  const despesasPorNatureza = despesasNaturezaTemplate.map(n => {
    const rawAtual = targetMonths.reduce((acc, m) => acc + (m.naturezasDespesa[n.id] ?? (n.liquidado / 12)), 0);
    const rawAnt = targetMonths.reduce((acc, m) => acc + (m.naturezasDespesa[n.id] ?? (n.liquidado / 12 * 0.98)), 0);

    const atual = rawAtual * yearFactorAtual;
    const anterior = rawAnt * yearFactorAnterior;
    const delta = calcDelta(atual, anterior);

    return {
      id: n.id,
      categoria: n.categoria,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build expense by function
  const despesasPorFuncao = despesasFuncaoTemplate.map(f => {
    const rawAtual = targetMonths.reduce((acc, m) => acc + (m.funcoesDespesa[f.id] ?? (f.liquidado / 12)), 0);
    const rawAnt = targetMonths.reduce((acc, m) => acc + (m.funcoesDespesa[f.id] ?? (f.liquidado / 12 * 0.98)), 0);

    const atual = rawAtual * yearFactorAtual;
    const anterior = rawAnt * yearFactorAnterior;
    const delta = calcDelta(atual, anterior);

    return {
      id: f.id,
      funcao: f.funcao,
      atual,
      anterior,
      variacaoPct: delta.variacaoPct,
      diferencaNominal: delta.diferencaNominal,
    };
  });

  // Build 4-quarters history (Q1..Q4) comparing ano vs anoAnterior
  const historicoTrimestral = QUARTERS_INFO.map(q => {
    const qMonths = q.mesesIndices.map(idx => MONTHLY_BASE_SERIES[idx]);
    const qRecAtual = qMonths.reduce((acc, m) => acc + m.receitaTotal, 0) * yearFactorAtual;
    const qRecAnt = qMonths.reduce((acc, m) => acc + m.receitaTotal, 0) * yearFactorAnterior;

    const qDespAtual = qMonths.reduce((acc, m) => acc + m.despesaTotalLiquidada, 0) * yearFactorAtual;
    const qDespAnt = qMonths.reduce((acc, m) => acc + m.despesaTotalLiquidada, 0) * yearFactorAnterior;

    const qRclAtual = qMonths.reduce((acc, m) => acc + m.rclMensal, 0) * yearFactorAtual;
    const qPessoalAtual = qMonths.reduce((acc, m) => acc + m.despesaPessoalMensal, 0) * yearFactorAtual;

    const varRecYoY = qRecAnt !== 0 ? ((qRecAtual - qRecAnt) / qRecAnt) * 100 : 0;
    const varDespYoY = qDespAnt !== 0 ? ((qDespAtual - qDespAnt) / qDespAnt) * 100 : 0;
    const folhaPct = qRclAtual > 0 ? (qPessoalAtual / qRclAtual) * 100 : 0;

    return {
      trimestre: q.trimestre,
      trimestreNome: q.trimestreNome,
      trimestreRotulo: q.trimestreRotulo,
      meses: q.meses.join(', '),
      receitaAtual: qRecAtual,
      receitaAnterior: qRecAnt,
      variacaoReceitaYoY: +varRecYoY.toFixed(1),
      despesaAtual: qDespAtual,
      despesaAnterior: qDespAnt,
      variacaoDespesaYoY: +varDespYoY.toFixed(1),
      resultadoAtual: qRecAtual - qDespAtual,
      resultadoAnterior: qRecAnt - qDespAnt,
      pessoalPercentAtual: +folhaPct.toFixed(2),
    };
  });

  return {
    ano,
    anoAnterior,
    trimestre: targetQuarterIndex,
    trimestreNome: quarterMeta.trimestreNome,
    trimestreRotulo: quarterMeta.trimestreRotulo,
    meses: quarterMeta.meses,
    receitaTotal: calcDelta(recAtual, recAnt),
    despesaTotalLiquidada: calcDelta(despLiqAtual, despLiqAnt),
    despesaTotalEmpenhada: calcDelta(despEmpAtual, despEmpAnt),
    despesaTotalPaga: calcDelta(despPagaAtual, despPagaAnt),
    resultadoTrimestral: calcDelta(resAtual, resAnt),
    rclTrimestral: calcDelta(rclAtual, rclAnt),
    despesaPessoalTrimestral: calcDelta(pessoalAtual, pessoalAnt),
    folhaRclPercentual: {
      atual: +folhaPctAtual.toFixed(2),
      anterior: +folhaPctAnt.toFixed(2),
      deltaPp: +(folhaPctAtual - folhaPctAnt).toFixed(2),
    },
    receitasPorFonte,
    despesasPorNatureza,
    despesasPorFuncao,
    historicoTrimestral,
  };
}

/**
 * Returns complete 12 months trend data for Araucária for the selected fiscal year
 */
export function get12MonthsTrendData(ano: number): MonthTrendPoint[] {
  const yearFactor = ano === 2024 ? 0.94 : ano === 2025 ? 0.96 : 1.0;

  return MONTHLY_BASE_SERIES.map(item => {
    const receita = item.receitaTotal * yearFactor;
    const despesa = item.despesaTotalLiquidada * yearFactor;
    const despesaEmpenhada = item.despesaTotalEmpenhada * yearFactor;
    const despesaPaga = item.despesaTotalPaga * yearFactor;
    const rcl = item.rclMensal * yearFactor;
    const despesaPessoal = item.despesaPessoalMensal * yearFactor;
    const resultado = receita - despesa;
    const pessoalPercent = rcl > 0 ? (despesaPessoal / rcl) * 100 : 0;
    const margemPercent = receita > 0 ? (resultado / receita) * 100 : 0;

    return {
      mesIndex: item.mesIndex,
      mes: item.mes,
      mesNome: item.mesNome,
      receita,
      despesa,
      despesaEmpenhada,
      despesaPaga,
      resultado,
      rcl,
      despesaPessoal,
      pessoalPercent: +pessoalPercent.toFixed(2),
      margemPercent: +margemPercent.toFixed(1),
    };
  });
}

