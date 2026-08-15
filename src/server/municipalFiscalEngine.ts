import { MUNICIPIOS_REFERENCIA, autoDiscoverMunicipality, MunicipioBase } from '../data/municipiosBrasil';

export interface TenantInfo {
  id: string;
  codigoIbge: string;
  nomePrefeitura: string;
  cidade: string;
  uf: string;
  cnpj: string;
  populacaoEstimada?: number;
  planoNome?: string;
  status?: string;
  emailFaturamento?: string;
  telefoneContato?: string;
}

// Deputados e Senadores do Paraná e outras bancadas para emendas
const PARLAMENTARES_POR_UF: Record<string, Array<{ nome: string; partido: string; esfera: 'Federal' | 'Estadual'; cargo: string }>> = {
  PR: [
    { nome: 'Deputado Federal Sérgio Souza', partido: 'MDB', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputado Federal Luciano Ducci', partido: 'PSB', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputada Federal Gleisi Hoffmann', partido: 'PT', esfera: 'Federal', cargo: 'Deputada Federal' },
    { nome: 'Deputado Federal Beto Richa', partido: 'PSDB', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputado Federal Enio Verri', partido: 'PT', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputado Federal Aliel Machado', partido: 'PV', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Senador Flávio Arns', partido: 'PSB', esfera: 'Federal', cargo: 'Senador da República' },
    { nome: 'Senador Sergio Moro', partido: 'UNIÃO', esfera: 'Federal', cargo: 'Senador da República' },
    { nome: 'Senador Oriovisto Guimarães', partido: 'PODE', esfera: 'Federal', cargo: 'Senador da República' },
    { nome: 'Deputado Estadual Hussein Bakri', partido: 'PSD', esfera: 'Estadual', cargo: 'Deputado Estadual (ALEP)' },
    { nome: 'Deputado Estadual Ademar Traiano', partido: 'PSD', esfera: 'Estadual', cargo: 'Deputado Estadual (ALEP)' },
    { nome: 'Deputado Estadual Alexandre Curi', partido: 'PSD', esfera: 'Estadual', cargo: 'Deputado Estadual (ALEP)' },
  ],
  SP: [
    { nome: 'Deputado Federal Tabata Amaral', partido: 'PSB', esfera: 'Federal', cargo: 'Deputada Federal' },
    { nome: 'Deputado Federal Guilherme Boulos', partido: 'PSOL', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputado Federal Baleia Rossi', partido: 'MDB', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Senador Marcos Pontes', partido: 'PL', esfera: 'Federal', cargo: 'Senador da República' },
  ],
  SC: [
    { nome: 'Deputada Federal Carmen Zanotto', partido: 'CIDADANIA', esfera: 'Federal', cargo: 'Deputada Federal' },
    { nome: 'Deputado Federal Esperidião Amin', partido: 'PP', esfera: 'Federal', cargo: 'Senador da República' },
  ],
  RS: [
    { nome: 'Deputado Federal Marcel van Hattem', partido: 'NOVO', esfera: 'Federal', cargo: 'Deputado Federal' },
    { nome: 'Deputada Federal Maria do Rosário', partido: 'PT', esfera: 'Federal', cargo: 'Deputada Federal' },
    { nome: 'Senador Paulo Paim', partido: 'PT', esfera: 'Federal', cargo: 'Senador da República' },
  ],
};

export function resolveTenant(tenantIdOrIbge: string | undefined, saasTenants: any[]): TenantInfo {
  if (!tenantIdOrIbge || tenantIdOrIbge === 'tenant-araucaria' || tenantIdOrIbge === '4101804') {
    const found = saasTenants.find(t => t.id === 'tenant-araucaria' || t.codigoIbge === '4101804');
    if (found) return found;
    return {
      id: 'tenant-araucaria',
      codigoIbge: '4101804',
      nomePrefeitura: 'Prefeitura Municipal de Araucária',
      cidade: 'Araucária',
      uf: 'PR',
      cnpj: '76.105.535/0001-99',
      populacaoEstimada: 151666,
      planoNome: 'Plano Gestão Fiscal Completo',
      status: 'ATIVO',
    };
  }

  // Check in current saasTenants
  const matchTenant = saasTenants.find(t => t.id === tenantIdOrIbge || t.codigoIbge === tenantIdOrIbge);
  if (matchTenant) return matchTenant;

  // Check in catalog
  const ref = MUNICIPIOS_REFERENCIA.find(m => m.codigoIbge === tenantIdOrIbge || m.cidade.toLowerCase() === tenantIdOrIbge.toLowerCase());
  if (ref) {
    return {
      id: `tenant-${ref.cidade.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      codigoIbge: ref.codigoIbge,
      nomePrefeitura: ref.nomePrefeitura,
      cidade: ref.cidade,
      uf: ref.uf,
      cnpj: ref.cnpj,
      populacaoEstimada: ref.populacaoEstimada,
      planoNome: 'Plano Básico Municipal',
      status: 'ATIVO',
    };
  }

  // Auto discover
  const discovered = autoDiscoverMunicipality(tenantIdOrIbge);
  if (discovered) {
    return {
      id: `tenant-${discovered.cidade.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      codigoIbge: discovered.codigoIbge,
      nomePrefeitura: discovered.nomePrefeitura,
      cidade: discovered.cidade,
      uf: discovered.uf,
      cnpj: discovered.cnpj,
      populacaoEstimada: discovered.populacaoEstimada,
      planoNome: 'Plano Básico Municipal',
      status: 'ATIVO',
    };
  }

  // Fallback to default
  return {
    id: 'tenant-araucaria',
    codigoIbge: '4101804',
    nomePrefeitura: 'Prefeitura Municipal de Araucária',
    cidade: 'Araucária',
    uf: 'PR',
    cnpj: '76.105.535/0001-99',
    populacaoEstimada: 151666,
    planoNome: 'Plano Gestão Fiscal Completo',
    status: 'ATIVO',
  };
}

// Calculate base budget scale based on municipality
export function getMunicipalFinancialProfile(tenant: TenantInfo, ano: number = 2026) {
  const isAraucaria = tenant.codigoIbge === '4101804';
  const isCuritiba = tenant.codigoIbge === '4106902';
  const isLondrina = tenant.codigoIbge === '4113700';
  const isMaringa = tenant.codigoIbge === '4115200';
  const isCascavel = tenant.codigoIbge === '4104808';
  const isToledo = tenant.codigoIbge === '4127700';
  const isFoz = tenant.codigoIbge === '4108304';
  const isPontaGrossa = tenant.codigoIbge === '4119905';

  let orcamento2026 = 1910000000;
  let rcl2026 = 1354000000;
  let despesaPessoalPct = 50.15;
  let perfilEconomico = 'Industrial e Refino de Petróleo';

  if (isAraucaria) {
    orcamento2026 = 1910000000;
    rcl2026 = 1354000000;
    despesaPessoalPct = 50.15;
    perfilEconomico = 'Polo Petroquímico e Industrial (REPAR)';
  } else if (isCuritiba) {
    orcamento2026 = 12850000000;
    rcl2026 = 9850000000;
    despesaPessoalPct = 46.80;
    perfilEconomico = 'Capital & Polo Metropolitano de Serviços e Tecnologia';
  } else if (isLondrina) {
    orcamento2026 = 3150000000;
    rcl2026 = 2450000000;
    despesaPessoalPct = 49.20;
    perfilEconomico = 'Polo Comercial, Saúde e Universitário do Norte do PR';
  } else if (isMaringa) {
    orcamento2026 = 2480000000;
    rcl2026 = 1950000000;
    despesaPessoalPct = 47.80;
    perfilEconomico = 'Polo de Serviços, Saúde, TIC e Agronegócio do Noroeste';
  } else if (isCascavel) {
    orcamento2026 = 2100000000;
    rcl2026 = 1650000000;
    despesaPessoalPct = 48.40;
    perfilEconomico = 'Polo Agroindustrial e Logístico do Oeste do PR';
  } else if (isToledo) {
    orcamento2026 = 920000000;
    rcl2026 = 730000000;
    despesaPessoalPct = 47.10;
    perfilEconomico = 'Capital Paranaense do Agronegócio e Suinocultura';
  } else if (isFoz) {
    orcamento2026 = 1850000000;
    rcl2026 = 1450000000;
    despesaPessoalPct = 48.90;
    perfilEconomico = 'Polo Internacional de Turismo, Fronteira e Energia (Itaipu)';
  } else if (isPontaGrossa) {
    orcamento2026 = 1950000000;
    rcl2026 = 1550000000;
    despesaPessoalPct = 48.20;
    perfilEconomico = 'Maior Polo Industrial do Interior do Paraná (Campos Gerais)';
  } else {
    // Dynamic calculation based on population
    const pop = tenant.populacaoEstimada || 50000;
    const perCapitaBudget = pop > 300000 ? 5800 : pop > 100000 ? 5200 : 4500;
    orcamento2026 = Math.round(pop * perCapitaBudget);
    rcl2026 = Math.round(orcamento2026 * 0.76);
    despesaPessoalPct = 48.50;
    perfilEconomico = `Economia Municipal de ${tenant.cidade} (${tenant.uf})`;
  }

  // Yearly scaling factors
  const factor2025 = 0.965;
  const factor2024 = 0.935;

  let orcamento = orcamento2026;
  let rcl = rcl2026;
  if (ano === 2025) {
    orcamento = Math.round(orcamento2026 * factor2025);
    rcl = Math.round(rcl2026 * factor2025);
    despesaPessoalPct = isAraucaria ? 50.20 : Number((despesaPessoalPct + 0.3).toFixed(2));
  } else if (ano === 2024) {
    orcamento = Math.round(orcamento2026 * factor2024);
    rcl = Math.round(rcl2026 * factor2024);
    despesaPessoalPct = isAraucaria ? 49.80 : Number((despesaPessoalPct + 0.1).toFixed(2));
  }

  return {
    orcamento,
    rcl,
    despesaPessoalPct,
    perfilEconomico,
    isAraucaria,
  };
}

// 1. Fiscal Summary
export function getMunicipalFiscalSummary(tenant: TenantInfo, ano: number = 2026) {
  const profile = getMunicipalFinancialProfile(tenant, ano);
  const orcado = profile.orcamento;
  const rcl = profile.rcl;

  let reestimada = isNaN(ano) || ano === 2026 ? Math.round(orcado * 0.8945) : orcado;
  let realizada = ano === 2026 ? Math.round(orcado * 0.598) : Math.round(orcado * 0.982);
  let empenhada = ano === 2026 ? Math.round(orcado * 0.591) : Math.round(orcado * 0.970);
  let liquidada = ano === 2026 ? Math.round(orcado * 0.567) : Math.round(orcado * 0.948);
  let paga = ano === 2026 ? Math.round(orcado * 0.547) : Math.round(orcado * 0.932);

  const despesaPessoalTotal = Math.round(rcl * (profile.despesaPessoalPct / 100));
  const statusPessoal = profile.despesaPessoalPct >= 51.3 ? 'CRITICO' : profile.despesaPessoalPct >= 48.6 ? 'ATENCAO' : 'OK';

  const educacaoValor = Math.round(rcl * 0.654 * 0.274);
  const saudeValor = Math.round(rcl * 0.654 * 0.218);
  const fundebTotal = Math.round(orcado * 0.098);
  const metaCaptacaoAnual = Math.round(orcado * 0.065);
  const captacaoRealizada = Math.round(metaCaptacaoAnual * (ano === 2026 ? 0.632 : 0.84));
  const aportePrevidenciario = Math.round(orcado * 0.045);
  const servicoDivida = Math.round(orcado * 0.018);
  const superavitOrcamentario = Math.round(orcado * 0.031);

  return {
    exercicio: ano,
    receitaTotalOrcada: orcado,
    receitaTotalReestimada: reestimada,
    receitaTotalRealizada: realizada,
    despesaTotalOrcada: orcado,
    despesaTotalEmpenhada: empenhada,
    despesaTotalLiquidada: liquidada,
    despesaTotalPaga: paga,
    rcl,
    despesaPessoalTotal,
    despesaPessoalPercentualRCL: profile.despesaPessoalPct,
    limiteAlertaPessoal: 48.60,
    limitePrudencialPessoal: 51.30,
    limiteLegalPessoal: 54.00,
    statusPessoal,
    aportePrevidenciarioFPMA: aportePrevidenciario,
    servicoDivida,
    resultadoPrimario: superavitOrcamentario,
    resultadoNominal: Math.round(superavitOrcamentario * 0.6),
    superavitOrcamentario,
    aplicacaoEducacaoValor: educacaoValor,
    aplicacaoEducacaoPercentual: 27.4,
    aplicacaoSaudeValor: saudeValor,
    aplicacaoSaudePercentual: 21.82,
    fundebTotal,
    fundebMagisterioPercentual: 74.2,
    metaCaptacaoAnual,
    captacaoRealizada,
    municipioInfo: {
      nome: tenant.nomePrefeitura,
      cidade: tenant.cidade,
      uf: tenant.uf,
      codigoIbge: tenant.codigoIbge,
      perfil: profile.perfilEconomico,
    },
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `Modelo Preditivo LOA / SGF ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
      anexo: 'RREO Anexo 01 & RGF Anexo 01',
    },
  };
}

// 2. Receitas
export function getMunicipalReceitas(tenant: TenantInfo, ano: number = 2026) {
  const profile = getMunicipalFinancialProfile(tenant, ano);
  const total = profile.orcamento;

  const isAraucaria = tenant.codigoIbge === '4101804';
  const isCuritiba = tenant.codigoIbge === '4106902';
  const isMaringa = tenant.codigoIbge === '4115200';
  const isLondrina = tenant.codigoIbge === '4113700';

  // Ratios
  let icmsRatio = 0.28;
  let issRatio = 0.15;
  let iptuRatio = 0.12;
  let ipvaRatio = 0.08;
  let fpmRatio = 0.08;
  let fundebRatio = 0.10;
  let susRatio = 0.09;
  let royaltiesRatio = 0.04;
  let outrasRatio = 0.06;

  if (isAraucaria) {
    icmsRatio = 0.32;
    issRatio = 0.14;
    iptuRatio = 0.10;
    royaltiesRatio = 0.07;
    fpmRatio = 0.06;
  } else if (isCuritiba) {
    issRatio = 0.25;
    iptuRatio = 0.18;
    icmsRatio = 0.19;
    ipvaRatio = 0.10;
    royaltiesRatio = 0.01;
  } else if (isMaringa) {
    issRatio = 0.19;
    iptuRatio = 0.15;
    icmsRatio = 0.23;
    fpmRatio = 0.08;
    royaltiesRatio = 0.01;
  } else if (isLondrina) {
    issRatio = 0.18;
    iptuRatio = 0.16;
    icmsRatio = 0.24;
    fpmRatio = 0.08;
    royaltiesRatio = 0.01;
  }

  const calcMonths = (valTotal: number) => {
    const baseMonth = valTotal / 12;
    return [
      Math.round(baseMonth * 1.15), // Jan (IPTU / IPVA)
      Math.round(baseMonth * 1.25), // Fev
      Math.round(baseMonth * 1.05), // Mar
      Math.round(baseMonth * 0.95), // Abr
      Math.round(baseMonth * 0.98), // Mai
      Math.round(baseMonth * 1.02), // Jun
      Math.round(baseMonth * 0.92), // Jul
      Math.round(baseMonth * 0.96), // Ago
      Math.round(baseMonth * 0.94), // Set
      Math.round(baseMonth * 0.95), // Out
      Math.round(baseMonth * 1.08), // Nov
      Math.round(baseMonth * 1.22), // Dez (13º)
    ];
  };

  const icmsVal = Math.round(total * icmsRatio);
  const issVal = Math.round(total * issRatio);
  const iptuVal = Math.round(total * iptuRatio);
  const ipvaVal = Math.round(total * ipvaRatio);
  const fpmVal = Math.round(total * fpmRatio);
  const fundebVal = Math.round(total * fundebRatio);
  const susVal = Math.round(total * susRatio);
  const royaltiesVal = Math.round(total * royaltiesRatio);
  const outrasVal = Math.round(total * outrasRatio);

  const realizedFactor = ano === 2026 ? 0.62 : 0.98;

  const receitas = [
    {
      id: 'icms',
      nome: 'Cota-Parte do ICMS Estadual',
      categoria: 'Transferências do Estado',
      icone: 'Landmark',
      orcado: icmsVal,
      reestimado: Math.round(icmsVal * 0.88),
      realizado: Math.round(icmsVal * realizedFactor),
      variacaoLOA: -12.0,
      percentualTotal: Number((icmsRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(icmsVal),
      detalhe: `Cota-parte constitucional de 25% do ICMS arrecadado pelo Governo do Estado (${tenant.uf}) repassado a ${tenant.cidade}.`,
      grauSensibilidade: 'ALTA',
    },
    {
      id: 'issqn',
      nome: 'ISSQN — Imposto Sobre Serviços',
      categoria: 'Tributária Própria',
      icone: 'Receipt',
      orcado: issVal,
      reestimado: Math.round(issVal * 0.98),
      realizado: Math.round(issVal * realizedFactor),
      variacaoLOA: -2.0,
      percentualTotal: Number((issRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(issVal),
      detalhe: `Arrecadação direta municipal incidente sobre serviços prestados na economia de ${tenant.cidade}.`,
      grauSensibilidade: 'MEDIA',
    },
    {
      id: 'iptu',
      nome: 'IPTU — Imposto Predial e Territorial Urbano',
      categoria: 'Tributária Própria',
      icone: 'Building2',
      orcado: iptuVal,
      reestimado: Math.round(iptuVal * 0.97),
      realizado: Math.round(iptuVal * (ano === 2026 ? 0.78 : 0.97)),
      variacaoLOA: -3.0,
      percentualTotal: Number((iptuRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(iptuVal),
      detalhe: `Planta genérica de valores imobiliários e cadastro territorial urbano de ${tenant.cidade}.`,
      grauSensibilidade: 'BAIXA',
    },
    {
      id: 'fundeb_rec',
      nome: 'Transferências do FUNDEB (VAAF + VAAT + VAAR)',
      categoria: 'Transferências da União',
      icone: 'GraduationCap',
      orcado: fundebVal,
      reestimado: fundebVal,
      realizado: Math.round(fundebVal * realizedFactor),
      variacaoLOA: 0.0,
      percentualTotal: Number((fundebRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(fundebVal),
      detalhe: `Fundo de Manutenção e Desenvolvimento da Educação Básica e Valorização dos Profissionais da Educação em ${tenant.cidade}.`,
      grauSensibilidade: 'BAIXA',
    },
    {
      id: 'ipva',
      nome: 'Cota-Parte do IPVA Estadual',
      categoria: 'Transferências do Estado',
      icone: 'Car',
      orcado: ipvaVal,
      reestimado: ipvaVal,
      realizado: Math.round(ipvaVal * (ano === 2026 ? 0.85 : 0.99)),
      variacaoLOA: 0.0,
      percentualTotal: Number((ipvaRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(ipvaVal),
      detalhe: `50% do IPVA arrecadado sobre a frota de veículos licenciada no município de ${tenant.cidade}.`,
      grauSensibilidade: 'BAIXA',
    },
    {
      id: 'fpm',
      nome: 'FPM — Fundo de Participação dos Municípios',
      categoria: 'Transferências da União',
      icone: 'Banknote',
      orcado: fpmVal,
      reestimado: fpmVal,
      realizado: Math.round(fpmVal * realizedFactor),
      variacaoLOA: 0.0,
      percentualTotal: Number((fpmRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(fpmVal),
      detalhe: `Repasses federais constitucionais decendiais calculados pela cota populacional do IBGE.`,
      grauSensibilidade: 'MEDIA',
    },
    {
      id: 'sus',
      nome: 'Transferências SUS / Fundo a Fundo (Saúde)',
      categoria: 'Transferências da União',
      icone: 'HeartPulse',
      orcado: susVal,
      reestimado: susVal,
      realizado: Math.round(susVal * realizedFactor),
      variacaoLOA: 0.0,
      percentualTotal: Number((susRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(susVal),
      detalhe: `Repasses federais do Ministério da Saúde para Atenção Primária, Média e Alta Complexidade em ${tenant.cidade}.`,
      grauSensibilidade: 'BAIXA',
    },
    {
      id: 'royalties',
      nome: isAraucaria ? 'Royalties do Petróleo / REPAR (ANP)' : 'Royalties & Compensações Financeiras (CFEM/ITAIPU)',
      categoria: 'Royalties/Compensações',
      icone: 'Flame',
      orcado: royaltiesVal,
      reestimado: Math.round(royaltiesVal * 0.72),
      realizado: Math.round(royaltiesVal * (ano === 2026 ? 0.45 : 0.75)),
      variacaoLOA: -28.0,
      percentualTotal: Number((royaltiesRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(royaltiesVal),
      detalhe: `Compensação financeira por exploração de recursos naturais e energia.`,
      grauSensibilidade: 'ALTA',
    },
    {
      id: 'outras_rec',
      nome: 'ITBI, Taxas Municipais e Outras Receitas Correntes',
      categoria: 'Outras',
      icone: 'Coins',
      orcado: outrasVal,
      reestimado: outrasVal,
      realizado: Math.round(outrasVal * realizedFactor),
      variacaoLOA: 0.0,
      percentualTotal: Number((outrasRatio * 100).toFixed(1)),
      historicoMensal: calcMonths(outrasVal),
      detalhe: `Imposto sobre transmissão inter-vivos de bens imóveis, taxas de poder de polícia e rendimentos de aplicação financeira.`,
      grauSensibilidade: 'BAIXA',
    },
  ];

  return {
    ano,
    receitas,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `RREO Anexo 03 / LOA ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}

// 3. Despesas
export function getMunicipalDespesas(tenant: TenantInfo, ano: number = 2026) {
  const profile = getMunicipalFinancialProfile(tenant, ano);
  const total = profile.orcamento;

  const porNatureza = [
    {
      id: 'pessoal',
      categoria: '1. Pessoal e Encargos Sociais (Folha Municipal)',
      orcado: Math.round(total * 0.385),
      empenhado: Math.round(total * 0.380 * (ano === 2026 ? 0.60 : 0.98)),
      liquidado: Math.round(total * 0.378 * (ano === 2026 ? 0.58 : 0.96)),
      pago: Math.round(total * 0.375 * (ano === 2026 ? 0.56 : 0.95)),
      percentualTotal: 38.5,
    },
    {
      id: 'custeio',
      categoria: '3. Outras Despesas Correntes (Custeio e Contratos)',
      orcado: Math.round(total * 0.415),
      empenhado: Math.round(total * 0.405 * (ano === 2026 ? 0.61 : 0.97)),
      liquidado: Math.round(total * 0.392 * (ano === 2026 ? 0.57 : 0.94)),
      pago: Math.round(total * 0.380 * (ano === 2026 ? 0.55 : 0.92)),
      percentualTotal: 41.5,
    },
    {
      id: 'investimentos',
      categoria: '4. Investimentos e Obras Públicas Municipais',
      orcado: Math.round(total * 0.125),
      empenhado: Math.round(total * 0.118 * (ano === 2026 ? 0.52 : 0.91)),
      liquidado: Math.round(total * 0.095 * (ano === 2026 ? 0.45 : 0.86)),
      pago: Math.round(total * 0.088 * (ano === 2026 ? 0.42 : 0.83)),
      percentualTotal: 12.5,
    },
    {
      id: 'previdencia',
      categoria: 'Aporte Previdenciário / Regime Próprio (RPPS)',
      orcado: Math.round(total * 0.045),
      empenhado: Math.round(total * 0.045 * (ano === 2026 ? 0.60 : 1.0)),
      liquidado: Math.round(total * 0.045 * (ano === 2026 ? 0.60 : 1.0)),
      pago: Math.round(total * 0.045 * (ano === 2026 ? 0.60 : 1.0)),
      percentualTotal: 4.5,
    },
    {
      id: 'divida',
      categoria: 'Amortização e Encargos da Dívida Fundada',
      orcado: Math.round(total * 0.018),
      empenhado: Math.round(total * 0.018 * (ano === 2026 ? 0.60 : 0.98)),
      liquidado: Math.round(total * 0.018 * (ano === 2026 ? 0.60 : 0.98)),
      pago: Math.round(total * 0.018 * (ano === 2026 ? 0.60 : 0.98)),
      percentualTotal: 1.8,
    },
    {
      id: 'inversoes',
      categoria: 'Inversões Financeiras e Reserva de Contingência',
      orcado: Math.round(total * 0.012),
      empenhado: Math.round(total * 0.005 * (ano === 2026 ? 0.30 : 0.50)),
      liquidado: Math.round(total * 0.004 * (ano === 2026 ? 0.30 : 0.50)),
      pago: Math.round(total * 0.004 * (ano === 2026 ? 0.30 : 0.50)),
      percentualTotal: 1.2,
    },
  ];

  const porFuncao = [
    {
      id: 'educacao',
      funcao: '12 - Educação',
      icone: 'GraduationCap',
      orcado: Math.round(total * 0.258),
      empenhado: Math.round(total * 0.252 * (ano === 2026 ? 0.60 : 0.97)),
      liquidado: Math.round(total * 0.248 * (ano === 2026 ? 0.58 : 0.95)),
      pago: Math.round(total * 0.244 * (ano === 2026 ? 0.56 : 0.94)),
      percentualOrcamento: 25.8,
    },
    {
      id: 'saude',
      funcao: '10 - Saúde',
      icone: 'HeartPulse',
      orcado: Math.round(total * 0.222),
      empenhado: Math.round(total * 0.218 * (ano === 2026 ? 0.61 : 0.98)),
      liquidado: Math.round(total * 0.214 * (ano === 2026 ? 0.59 : 0.96)),
      pago: Math.round(total * 0.210 * (ano === 2026 ? 0.57 : 0.95)),
      percentualOrcamento: 22.2,
    },
    {
      id: 'urbanismo',
      funcao: '15 - Urbanismo e Obras Viárias',
      icone: 'Building2',
      orcado: Math.round(total * 0.145),
      empenhado: Math.round(total * 0.132 * (ano === 2026 ? 0.54 : 0.91)),
      liquidado: Math.round(total * 0.118 * (ano === 2026 ? 0.48 : 0.87)),
      pago: Math.round(total * 0.110 * (ano === 2026 ? 0.45 : 0.84)),
      percentualOrcamento: 14.5,
    },
    {
      id: 'previdencia_f',
      funcao: '09 - Previdência Social',
      icone: 'ShieldCheck',
      orcado: Math.round(total * 0.102),
      empenhado: Math.round(total * 0.100 * (ano === 2026 ? 0.60 : 0.99)),
      liquidado: Math.round(total * 0.100 * (ano === 2026 ? 0.60 : 0.99)),
      pago: Math.round(total * 0.100 * (ano === 2026 ? 0.60 : 0.99)),
      percentualOrcamento: 10.2,
    },
    {
      id: 'administracao',
      funcao: '04 - Administração Geral',
      icone: 'Briefcase',
      orcado: Math.round(total * 0.082),
      empenhado: Math.round(total * 0.078 * (ano === 2026 ? 0.58 : 0.96)),
      liquidado: Math.round(total * 0.075 * (ano === 2026 ? 0.56 : 0.94)),
      pago: Math.round(total * 0.074 * (ano === 2026 ? 0.55 : 0.93)),
      percentualOrcamento: 8.2,
    },
    {
      id: 'seguranca',
      funcao: '06 - Segurança Pública / Guarda Municipal',
      icone: 'Shield',
      orcado: Math.round(total * 0.045),
      empenhado: Math.round(total * 0.043 * (ano === 2026 ? 0.59 : 0.97)),
      liquidado: Math.round(total * 0.042 * (ano === 2026 ? 0.58 : 0.95)),
      pago: Math.round(total * 0.041 * (ano === 2026 ? 0.56 : 0.94)),
      percentualOrcamento: 4.5,
    },
    {
      id: 'assistencia',
      funcao: '08 - Assistência Social',
      icone: 'Users',
      orcado: Math.round(total * 0.038),
      empenhado: Math.round(total * 0.036 * (ano === 2026 ? 0.58 : 0.96)),
      liquidado: Math.round(total * 0.035 * (ano === 2026 ? 0.56 : 0.94)),
      pago: Math.round(total * 0.034 * (ano === 2026 ? 0.55 : 0.93)),
      percentualOrcamento: 3.8,
    },
    {
      id: 'meio_ambiente',
      funcao: '18 - Gestão Ambiental e Saneamento',
      icone: 'Trees',
      orcado: Math.round(total * 0.030),
      empenhado: Math.round(total * 0.028 * (ano === 2026 ? 0.56 : 0.93)),
      liquidado: Math.round(total * 0.026 * (ano === 2026 ? 0.54 : 0.91)),
      pago: Math.round(total * 0.025 * (ano === 2026 ? 0.52 : 0.89)),
      percentualOrcamento: 3.0,
    },
    {
      orcado: Math.round(total * 0.078),
      empenhado: Math.round(total * 0.072 * (ano === 2026 ? 0.52 : 0.90)),
      liquidado: Math.round(total * 0.068 * (ano === 2026 ? 0.48 : 0.86)),
      pago: Math.round(total * 0.064 * (ano === 2026 ? 0.46 : 0.84)),
      percentualOrcamento: 7.8,
    },
  ];

  return {
    ano,
    porNatureza,
    porFuncao,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `RREO Anexo 02 / LOA ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}

// 4. Limites LRF
export function getMunicipalLimites(tenant: TenantInfo, ano: number = 2026) {
  const profile = getMunicipalFinancialProfile(tenant, ano);
  const rcl = profile.rcl;
  const pessoalPct = profile.despesaPessoalPct;
  const pessoalValor = Math.round(rcl * (pessoalPct / 100));

  const baseImpostos = Math.round(rcl * 0.654);
  const educacaoValor = Math.round(baseImpostos * 0.274);
  const saudeValor = Math.round(baseImpostos * 0.2182);
  const fundebBase = Math.round(profile.orcamento * 0.098);
  const fundebValor = Math.round(fundebBase * 0.742);

  const dividaValor = Math.round(rcl * 0.128);
  const antecipacaoReceita = Math.round(rcl * 0.0314);

  const limites = [
    {
      id: 'pessoal_executivo',
      nome: 'Despesa Total com Pessoal — Poder Executivo',
      baseCalculoNome: 'Receita Corrente Líquida (RCL)',
      baseCalculoValor: rcl,
      valorRealizado: pessoalValor,
      percentualRealizado: pessoalPct,
      limiteMinimoOuMaximo: 'maximo',
      limiteAlerta: 48.60,
      limitePrudencial: 51.30,
      limiteLegal: 54.00,
      status: pessoalPct > 54 ? 'CRITICO' : pessoalPct > 51.3 ? 'PRUDENCIAL' : pessoalPct > 48.6 ? 'ALERTA' : 'OK',
      fundamentoLegal: 'Art. 19, III e Art. 20, III, "b" da LRF (LC 101/2000)',
      observacao: `Gasto com pessoal do Executivo em ${pessoalPct}%. ${pessoalPct > 51.3 ? 'Atenção: próximo ou acima do limite prudencial.' : 'Enquadramento regular.'}`,
    },
    {
      id: 'educacao_mde',
      nome: 'Aplicação em Manutenção e Desenv. do Ensino (MDE)',
      baseCalculoNome: 'Receita Líquida de Impostos e Transferências',
      baseCalculoValor: baseImpostos,
      valorRealizado: educacaoValor,
      percentualRealizado: 27.40,
      limiteMinimoOuMaximo: 'minimo',
      limiteLegal: 25.00,
      status: 'OK',
      fundamentoLegal: 'Art. 212 da Constituição Federal de 1988',
      observacao: `Aplicação constitucional de 27,4% da receita resultante de impostos na Educação em ${tenant.cidade}, cumprindo o piso de 25,0%.`,
    },
    {
      id: 'saude_asps',
      nome: 'Ações e Serviços Públicos de Saúde (ASPS)',
      baseCalculoNome: 'Receita Líquida de Impostos e Transferências',
      baseCalculoValor: baseImpostos,
      valorRealizado: saudeValor,
      percentualRealizado: 21.82,
      limiteMinimoOuMaximo: 'minimo',
      limiteLegal: 15.00,
      status: 'OK',
      fundamentoLegal: 'Art. 198 da CF/88 e Lei Complementar nº 141/2012',
      observacao: `Aplicação em Saúde em ${tenant.cidade} atinge 21,82%, superando com folga a exigência mínima de 15,0%.`,
    },
    {
      id: 'fundeb_magisterio',
      nome: 'Aplicação do FUNDEB na Remuneração do Magistério',
      baseCalculoNome: 'Total de Recursos do FUNDEB Recebidos',
      baseCalculoValor: fundebBase,
      valorRealizado: fundebValor,
      percentualRealizado: 74.20,
      limiteMinimoOuMaximo: 'minimo',
      limiteLegal: 70.00,
      status: 'OK',
      fundamentoLegal: 'Art. 212-A, XI da CF/88 e Lei 14.113/2020 (Novo FUNDEB)',
      observacao: `Conformidade mantida em ${tenant.cidade}. Aplicação de 74,2% cumpre a exigência mínima de 70% para a folha do magistério.`,
    },
    {
      id: 'divida_consolidada',
      nome: 'Dívida Consolidada Líquida (DCL)',
      baseCalculoNome: 'Receita Corrente Líquida (RCL)',
      baseCalculoValor: rcl,
      valorRealizado: dividaValor,
      percentualRealizado: 12.80,
      limiteMinimoOuMaximo: 'maximo',
      limiteAlerta: 108.00,
      limitePrudencial: 114.00,
      limiteLegal: 120.00,
      status: 'OK',
      fundamentoLegal: 'Resolução nº 43/2001 do Senado Federal',
      observacao: `Excelente perfil de endividamento em ${tenant.cidade}. Endividamento líquido de 12,80% da RCL, muito abaixo do teto de 120,00%.`,
    },
    {
      id: 'operacoes_credito',
      nome: 'Operações de Crédito (Endividamento Anual)',
      baseCalculoNome: 'Receita Corrente Líquida (RCL)',
      baseCalculoValor: rcl,
      valorRealizado: antecipacaoReceita,
      percentualRealizado: 3.14,
      limiteMinimoOuMaximo: 'maximo',
      limiteLegal: 16.00,
      status: 'OK',
      fundamentoLegal: 'Resolução nº 43/2001 do Senado Federal',
      observacao: `Operações de crédito contratadas dentro do teto de 16% da RCL (3,14%).`,
    },
  ];

  return {
    ano,
    limites,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `RGF Anexo 01 / TCE-${tenant.uf} ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}

// 5. Captação & Emendas
export function getMunicipalCaptacao(tenant: TenantInfo) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const metaAnual = Math.round(profile.orcamento * 0.065);
  const captado = Math.round(metaAnual * 0.632);

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const formatDate = (daysAgo: number) =>
    new Date(now - daysAgo * ONE_DAY_MS).toISOString().split('T')[0];

  const parlamentares = PARLAMENTARES_POR_UF[tenant.uf] || PARLAMENTARES_POR_UF['PR'];

  const emendas = [
    {
      id: 'emenda-01',
      autor: `Bancada de ${tenant.uf} (Coordenação)`,
      partido: `Bancada ${tenant.uf}`,
      esfera: 'Federal',
      tipo: 'RP7 (Bancada)',
      numero: '71240008/2026',
      objeto: `Estruturação da Rede de Urgência e Emergência (Hospital e UPA de ${tenant.cidade})`,
      orgaoDestino: 'Secretaria Municipal de Saúde',
      valorIndicado: Math.round(metaAnual * 0.24),
      valorEmpenhado: Math.round(metaAnual * 0.24),
      valorPago: Math.round(metaAnual * 0.18),
      status: 'Paga',
      ano: 2026,
      dataProcessamento: formatDate(2),
    },
    {
      id: 'emenda-02',
      autor: parlamentares[0]?.nome || 'Deputado Federal da Região',
      partido: parlamentares[0]?.partido || 'MDB',
      esfera: 'Federal',
      tipo: 'RP6 (Individual)',
      numero: '38210004/2026',
      objeto: `Pavimentação asfáltica, recape e drenagem pluvial em bairros de ${tenant.cidade}`,
      orgaoDestino: 'Secretaria Municipal de Obras Públicas',
      valorIndicado: Math.round(metaAnual * 0.11),
      valorEmpenhado: Math.round(metaAnual * 0.11),
      valorPago: Math.round(metaAnual * 0.11),
      status: 'Paga',
      ano: 2026,
      dataProcessamento: formatDate(4),
    },
    {
      id: 'emenda-03',
      autor: parlamentares[1]?.nome || 'Deputado Federal',
      partido: parlamentares[1]?.partido || 'PSB',
      esfera: 'Federal',
      tipo: 'RP6 (Individual)',
      numero: '29140002/2026',
      objeto: `Aquisição de equipamentos de diagnóstico e veículos para UBSs de ${tenant.cidade}`,
      orgaoDestino: 'Fundo Municipal de Saúde',
      valorIndicado: Math.round(metaAnual * 0.07),
      valorEmpenhado: Math.round(metaAnual * 0.07),
      valorPago: Math.round(metaAnual * 0.07),
      status: 'Paga',
      ano: 2026,
      dataProcessamento: formatDate(5),
    },
    {
      id: 'emenda-04',
      autor: 'Comissão de Educação da Câmara Federal',
      partido: 'Comissão',
      esfera: 'Federal',
      tipo: 'RP8 (Comissão)',
      numero: '50190011/2026',
      objeto: `Construção de CMEI e ampliação de quadras esportivas escolares em ${tenant.cidade}`,
      orgaoDestino: 'Secretaria Municipal de Educação',
      valorIndicado: Math.round(metaAnual * 0.16),
      valorEmpenhado: Math.round(metaAnual * 0.16),
      valorPago: Math.round(metaAnual * 0.10),
      status: 'Empenhada',
      ano: 2026,
      dataProcessamento: formatDate(18),
    },
    {
      id: 'emenda-05',
      autor: parlamentares.find(p => p.esfera === 'Estadual')?.nome || 'Deputado Estadual',
      partido: 'PSD',
      esfera: 'Estadual',
      tipo: `Emenda Estadual ${tenant.uf}`,
      numero: `${tenant.uf}-410/2026`,
      objeto: `Renovação da frota de transporte escolar acessível e apoio aos distritos de ${tenant.cidade}`,
      orgaoDestino: 'Secretaria Municipal de Educação',
      valorIndicado: Math.round(metaAnual * 0.06),
      valorEmpenhado: Math.round(metaAnual * 0.06),
      valorPago: Math.round(metaAnual * 0.06),
      status: 'Paga',
      ano: 2026,
      dataProcessamento: formatDate(35),
    },
  ];

  const novasEmendas7Dias = emendas.filter(e => {
    const diff = now - new Date(e.dataProcessamento).getTime();
    return diff >= 0 && diff <= 7 * ONE_DAY_MS;
  }).length;

  const convenios = [
    {
      id: 'conv-01',
      numeroProposta: '948102/2025',
      concedente: 'Governo Federal / Ministério das Cidades',
      ministerio: 'Ministério das Cidades',
      objeto: `Macro-drenagem e Contenção de Enchentes em Bacias Urbanas de ${tenant.cidade}`,
      valorGlobal: Math.round(metaAnual * 0.32),
      valorRepasse: Math.round(metaAnual * 0.28),
      contrapartida: Math.round(metaAnual * 0.04),
      valorLiberado: Math.round(metaAnual * 0.18),
      status: 'Em Execução',
      vigenciaFim: '2027-12-31',
    },
    {
      id: 'conv-02',
      numeroProposta: '931204/2025',
      concedente: 'FNDE / Ministério da Educação',
      ministerio: 'Ministério da Educação',
      objeto: `Programa Nacional de Transporte Escolar (PNATE) e climatização sustentável em ${tenant.cidade}`,
      valorGlobal: Math.round(metaAnual * 0.13),
      valorRepasse: Math.round(metaAnual * 0.12),
      contrapartida: Math.round(metaAnual * 0.01),
      valorLiberado: Math.round(metaAnual * 0.07),
      status: 'Em Execução',
      vigenciaFim: '2026-11-30',
    },
    {
      id: 'conv-03',
      numeroProposta: '954201/2026',
      concedente: `Governo do Estado (${tenant.uf}) / SEDEST`,
      ministerio: 'Paraná Cidade / SEDEST',
      objeto: `Implantação de Parque Linear Municipal, ciclovia e iluminação LED solar em ${tenant.cidade}`,
      valorGlobal: Math.round(metaAnual * 0.21),
      valorRepasse: Math.round(metaAnual * 0.18),
      contrapartida: Math.round(metaAnual * 0.03),
      valorLiberado: Math.round(metaAnual * 0.03),
      status: 'Em Execução',
      vigenciaFim: '2027-06-30',
    },
  ];

  return {
    metaAnual,
    captadoAcumulado: captado,
    percentualAtingimento: ((captado / metaAnual) * 100).toFixed(1),
    novasEmendas7Dias,
    emendas,
    convenios,
  };
}

// 6. FUNDEB
export function getMunicipalFundeb(tenant: TenantInfo) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const totalFundeb = Math.round(profile.orcamento * 0.098);
  const baseMonth = totalFundeb / 12;

  const repassesMensais = [
    { mes: 'Jan', vaaf: Math.round(baseMonth * 0.70), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.83) },
    { mes: 'Fev', vaaf: Math.round(baseMonth * 0.71), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.84) },
    { mes: 'Mar', vaaf: Math.round(baseMonth * 0.72), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.85) },
    { mes: 'Abr', vaaf: Math.round(baseMonth * 0.70), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.83) },
    { mes: 'Mai', vaaf: Math.round(baseMonth * 0.71), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.84) },
    { mes: 'Jun', vaaf: Math.round(baseMonth * 0.71), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.84) },
    { mes: 'Jul', vaaf: Math.round(baseMonth * 0.70), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.83) },
    { mes: 'Ago', vaaf: Math.round(baseMonth * 0.71), vaat: Math.round(baseMonth * 0.09), vaar: Math.round(baseMonth * 0.04), total: Math.round(baseMonth * 0.84) },
  ];

  const gastoMagisterio = Math.round(totalFundeb * 0.742);
  const gastoManutencao = Math.round(totalFundeb * 0.258);

  return {
    exercicio: 2026,
    repassesRecebidosTotal: totalFundeb,
    repassesMensais,
    gastoProfissionaisEducacao: gastoMagisterio,
    percentualMagisterio: 74.20,
    gastoManutencaoDesenvolvimento: gastoManutencao,
    percentualManutencao: 25.80,
    statusSIOPE: 'Transmitido e Homologado',
    statusMSC: 'Enviado sem Inconsistências',
    riscoPerdaVAAT: false,
    parecerTCEPR: `Regular perante o Tribunal de Contas de ${tenant.uf}`,
    indicadoresVAAT: {
      capacidadeAtendimentoInfantil: `93% das metas do PME de ${tenant.cidade} cumpridas`,
      pessoalEducacaoBasicaCadastrado: '100% Censo Escolar validado',
      transmissaoMatrizMSC: 'Bimestres transmitidos no prazo Siconfi',
    },
  };
}

// 7. Alertas
export function getMunicipalAlertas(tenant: TenantInfo) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const pessoalPct = profile.despesaPessoalPct;
  const isAraucaria = tenant.codigoIbge === '4101804';

  return [
    {
      id: 'alerta-01',
      tipo: pessoalPct >= 48.6 ? 'ATENCAO' : 'OK',
      titulo: `Gasto com Pessoal em ${pessoalPct.toFixed(2)}% da RCL (${tenant.cidade})`,
      descricao: `A despesa com pessoal do Poder Executivo em ${tenant.cidade} está em ${pessoalPct.toFixed(2)}% da RCL (Limite de Alerta: 48,60% | Prudencial: 51,30%).`,
      impacto: pessoalPct >= 51.30 ? 'Vedações do art. 22 da LRF' : 'Acompanhamento trimestral de vigilância contábil.',
      orgao: 'Secretaria de Finanças e Administração',
      dataAlerta: '2026-08-10',
      acaoRecomendada: 'Manter controle rigoroso de horas extras e novas contratações administrativas.',
    },
    {
      id: 'alerta-02',
      tipo: isAraucaria ? 'CRITICO' : 'OK',
      titulo: isAraucaria ? 'Queda de Receita de ICMS e Royalties REPAR' : `Comportamento da Cota-Parte de ICMS e Tributos em ${tenant.cidade}`,
      descricao: isAraucaria
        ? 'A cota-parte de ICMS e royalties de petróleo sofreram redução de -17,5%, exigindo reestimativa orçamentária.'
        : `A arrecadação de tributos municipais e transferências em ${tenant.cidade} mantém estabilidade conforme cronograma fiscal.`,
      impacto: isAraucaria ? 'Reestimativa orçamentária para equilíbrio' : 'Equilíbrio financeiro positivo.',
      orgao: 'Secretaria de Planejamento e Orçamento',
      dataAlerta: '2026-08-01',
      acaoRecomendada: 'Acompanhar a arrecadação mensal e otimizar a captação de recursos externos.',
    },
    {
      id: 'alerta-03',
      tipo: 'OK',
      titulo: `FUNDEB Regular e Dentro dos Padrões do Tribunal de Contas (${tenant.uf})`,
      descricao: `Aplicação em remuneração do magistério de 74,2% cumpre a exigência mínima legal de 70% em ${tenant.cidade}.`,
      impacto: 'Garantia de manutenção da complementação da União (VAAT/VAAR).',
      orgao: 'Secretaria Municipal de Educação',
      dataAlerta: '2026-08-05',
      acaoRecomendada: 'Manter a transmissão tempestiva das matrizes de saldos contábeis (MSC).',
    },
    {
      id: 'alerta-04',
      tipo: 'OK',
      titulo: `Mínimos Constitucionais de Saúde (21,8%) e Educação (27,4%) Cumpridos em ${tenant.cidade}`,
      descricao: 'Os investimentos na saúde e educação superam com folga os mínimos legais de 15% e 25%.',
      impacto: 'Segurança jurídica e parecer favorável nas contas anuais.',
      orgao: 'Controladoria Geral do Município',
      dataAlerta: '2026-08-08',
      acaoRecomendada: 'Monitorar a liquidação e pagamento das despesas vinculadas.',
    },
  ];
}

// 8. Obras Públicas
export function getMunicipalObras(tenant: TenantInfo) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const total = profile.orcamento;
  const isAraucaria = tenant.codigoIbge === '4101804';
  const isCuritiba = tenant.codigoIbge === '4106902';
  const isMaringa = tenant.codigoIbge === '4115200';
  const isLondrina = tenant.codigoIbge === '4113700';

  let obras = [];

  if (isAraucaria) {
    obras = [
      {
        id: 'obra-01',
        codigo: 'OBR-2024-001',
        titulo: 'Duplicação e Revitalização da Av. Manoel Ribas e PR-423',
        secretaria: 'SMOP',
        secretariaNome: 'Secretaria Municipal de Obras Públicas',
        status: 'Em Execução',
        valorPrevisto: 42500000,
        valorLiquidado: 28900000,
        progressoFisico: 68.0,
        progressoFinanceiro: 68.0,
        bairro: 'Fazenda Velha / Costeira',
        regiao: 'Urbana Central',
        coordenadasSvg: { x: 440, y: 290 },
        coordenadasGeo: { lat: -25.5925, lng: -49.4062 },
        fonteRecurso: 'Finisa / Caixa',
        empresaContratada: 'Consórcio Pavimentação Araucária Ltda',
        numeroContrato: '114/2024-SMOP',
        dataInicio: '2024-04-10',
        dataPrevisaoFim: '2026-12-15',
        prazoDias: 980,
        diasDecorridos: 855,
        descricao: 'Duplicação de pista dupla, drenagem profunda, ciclovia segregada, iluminação pública em LED e novos passeios com acessibilidade universal.',
        destaque: true,
        beneficiariosEstimados: 85000,
        impactoSocial: 'Eliminação de gargalos no principal corredor de tráfego pesado e conexão com Curitiba/Campo Largo.',
      },
      {
        id: 'obra-02',
        codigo: 'OBR-2024-002',
        titulo: 'Construção do Novo Hospital e Maternidade Municipal de Araucária (HMA)',
        secretaria: 'SMSA',
        secretariaNome: 'Secretaria Municipal de Saúde',
        status: 'Em Execução',
        valorPrevisto: 68000000,
        valorLiquidado: 30600000,
        progressoFisico: 45.0,
        progressoFinanceiro: 45.0,
        bairro: 'Capela Velha',
        regiao: 'Urbana Norte',
        coordenadasSvg: { x: 510, y: 170 },
        coordenadasGeo: { lat: -25.5612, lng: -49.3820 },
        fonteRecurso: 'Tesouro Municipal',
        empresaContratada: 'Construtora Paranaense de Infraestrutura S.A.',
        numeroContrato: '088/2024-SMSA',
        dataInicio: '2024-02-15',
        dataPrevisaoFim: '2027-04-30',
        prazoDias: 1170,
        diasDecorridos: 910,
        descricao: 'Complexo hospitalar com 120 leitos de internação, 20 leitos de UTI geral e neonatal, centro cirúrgico com 5 salas e pronto-socorro 24h.',
        destaque: true,
        beneficiariosEstimados: 150000,
        impactoSocial: 'Autonomia total na média e alta complexidade hospitalar para Araucária e região metropolitana sul.',
      },
      {
        id: 'obra-03',
        codigo: 'OBR-2025-007',
        titulo: 'Complexo Escolar e CMEI Integrado Jardim Plínio',
        secretaria: 'SMED',
        secretariaNome: 'Secretaria Municipal de Educação',
        status: 'Em Execução',
        valorPrevisto: 18400000,
        valorLiquidado: 14720000,
        progressoFisico: 80.0,
        progressoFinanceiro: 80.0,
        bairro: 'Thomaz Coelho / Plínio',
        regiao: 'Urbana Leste',
        coordenadasSvg: { x: 620, y: 220 },
        coordenadasGeo: { lat: -25.5780, lng: -49.3650 },
        fonteRecurso: 'FUNDEB / FNDE',
        empresaContratada: 'Engenharia & Construções Iguaçu Ltda',
        numeroContrato: '042/2025-SMED',
        dataInicio: '2025-03-01',
        dataPrevisaoFim: '2026-10-30',
        prazoDias: 608,
        diasDecorridos: 530,
        descricao: 'Construção de 16 salas de aula climatizadas, laboratório de robótica, biblioteca multimídia e quadra poliesportiva coberta.',
        destaque: false,
        beneficiariosEstimados: 1200,
        impactoSocial: 'Abertura de 350 novas vagas em tempo integral na educação infantil e fundamental.',
      },
    ];
  } else if (isMaringa) {
    obras = [
      {
        id: 'obra-mar-01',
        codigo: 'OBR-MAR-2024-01',
        titulo: 'Revitalização e Modernização do Eixo Monumental de Maringá',
        secretaria: 'SMOP',
        secretariaNome: 'Secretaria Municipal de Obras Públicas',
        status: 'Em Execução',
        valorPrevisto: 54000000,
        valorLiquidado: 38880000,
        progressoFisico: 72.0,
        progressoFinanceiro: 72.0,
        bairro: 'Zona 01 / Centro',
        regiao: 'Eixo Central',
        coordenadasSvg: { x: 480, y: 260 },
        coordenadasGeo: { lat: -23.4209, lng: -51.9331 },
        fonteRecurso: 'Tesouro Municipal / Finisa',
        empresaContratada: 'Consórcio Eixo Monumental Maringá',
        numeroContrato: '045/2024-SMOP',
        dataInicio: '2024-03-15',
        dataPrevisaoFim: '2026-11-30',
        prazoDias: 990,
        diasDecorridos: 870,
        descricao: 'Integração urbanística da Praça da Catedral à Praça da Prefeitura com novas ciclovias, fontes interativas e calçadões acessíveis.',
        destaque: true,
        beneficiariosEstimados: 250000,
        impactoSocial: 'Valorização turística, pedestres e comércio central.',
      },
      {
        id: 'obra-mar-02',
        codigo: 'OBR-MAR-2024-02',
        titulo: 'Construção do Centro Municipal de Especialidades Médicas Zona Norte',
        secretaria: 'SMSA',
        secretariaNome: 'Secretaria Municipal de Saúde',
        status: 'Em Execução',
        valorPrevisto: 32000000,
        valorLiquidado: 19200000,
        progressoFisico: 60.0,
        progressoFinanceiro: 60.0,
        bairro: 'Jardim Alvorada / Zona 07',
        regiao: 'Zona Norte',
        coordenadasSvg: { x: 380, y: 160 },
        coordenadasGeo: { lat: -23.3980, lng: -51.9450 },
        fonteRecurso: 'Governo Federal / SIOPS',
        empresaContratada: 'Construtora Norte Paranaense S.A.',
        numeroContrato: '071/2024-SMSA',
        dataInicio: '2024-05-10',
        dataPrevisaoFim: '2027-02-28',
        prazoDias: 1024,
        diasDecorridos: 820,
        descricao: '30 consultórios médicos, centro cirúrgico ambulatorial, exames de tomografia e ultrassonografia de alta precisão.',
        destaque: true,
        beneficiariosEstimados: 120000,
        impactoSocial: 'Descentralização do atendimento médico especializado em Maringá.',
      },
      {
        id: 'obra-mar-03',
        codigo: 'OBR-MAR-2025-01',
        titulo: 'Implantação do Parque Tecnológico e Hub de Inovação de Maringá',
        secretaria: 'SMIC',
        secretariaNome: 'Secretaria de Inovação e Desenvolvimento',
        status: 'Em Execução',
        valorPrevisto: 24500000,
        valorLiquidado: 12250000,
        progressoFisico: 50.0,
        progressoFinanceiro: 50.0,
        bairro: 'Parque Industrial / Cidade Industrial',
        regiao: 'Zona Sul',
        coordenadasSvg: { x: 590, y: 380 },
        coordenadasGeo: { lat: -23.4550, lng: -51.9120 },
        fonteRecurso: 'FINEP / Estado do Paraná',
        empresaContratada: 'Engenharia Inovadora do Paraná Ltda',
        numeroContrato: '018/2025-SEID',
        dataInicio: '2025-02-01',
        dataPrevisaoFim: '2026-12-31',
        prazoDias: 698,
        diasDecorridos: 550,
        descricao: 'Laboratórios de Inteligência Artificial, aceleradora pública de startups e coworking para empresas de tecnologia.',
        destaque: false,
        beneficiariosEstimados: 15000,
        impactoSocial: 'Geração de empregos de alta tecnologia e atração de investimentos para o ecossistema maringaense.',
      },
    ];
  } else if (isCuritiba) {
    obras = [
      {
        id: 'obra-cwb-01',
        codigo: 'OBR-CWB-2024-01',
        titulo: 'Ampliação do BRT Linha Verde Sul e Estações Intermodais',
        secretaria: 'SMOP',
        secretariaNome: 'Secretaria Municipal de Obras Públicas',
        status: 'Em Execução',
        valorPrevisto: 180000000,
        valorLiquidado: 135000000,
        progressoFisico: 75.0,
        progressoFinanceiro: 75.0,
        bairro: 'Pinheirinho / CIC / Fanny',
        regiao: 'Eixo Sul Linha Verde',
        coordenadasSvg: { x: 490, y: 350 },
        coordenadasGeo: { lat: -25.4850, lng: -49.2780 },
        fonteRecurso: 'Banco Interamericano de Desenvolvimento (BID)',
        empresaContratada: 'Consórcio Linha Verde Metropolitana',
        numeroContrato: '012/2024-IPPUC',
        dataInicio: '2024-01-10',
        dataPrevisaoFim: '2026-12-20',
        prazoDias: 1075,
        diasDecorridos: 940,
        descricao: 'Canaleta exclusiva para ônibus elétricos, novas trincheiras viárias, ciclovia e iluminação inteligente em LED.',
        destaque: true,
        beneficiariosEstimados: 600000,
        impactoSocial: 'Redução de 30% no tempo de deslocamento metropolitano.',
      },
      {
        id: 'obra-cwb-02',
        codigo: 'OBR-CWB-2024-02',
        titulo: 'Complexo de Saúde e Hospital do Bairro CIC / Fazendinha',
        secretaria: 'SMSA',
        secretariaNome: 'Secretaria Municipal de Saúde',
        status: 'Em Execução',
        valorPrevisto: 95000000,
        valorLiquidado: 47500000,
        progressoFisico: 50.0,
        progressoFinanceiro: 50.0,
        bairro: 'Cidade Industrial de Curitiba (CIC)',
        regiao: 'Zona Oeste',
        coordenadasSvg: { x: 310, y: 320 },
        coordenadasGeo: { lat: -25.4950, lng: -49.3450 },
        fonteRecurso: 'Tesouro Municipal / Governo Estadual',
        empresaContratada: 'Construtora Capital Paranaense S.A.',
        numeroContrato: '054/2024-SMSA',
        dataInicio: '2024-04-15',
        dataPrevisaoFim: '2027-06-30',
        prazoDias: 1171,
        diasDecorridos: 840,
        descricao: 'Hospital com 150 leitos, pronto atendimento 24h e policlínica de especialidades.',
        destaque: true,
        beneficiariosEstimados: 350000,
        impactoSocial: 'Ampliação da capacidade de internação hospitalar na maior regional de Curitiba.',
      },
    ];
  } else if (isLondrina) {
    obras = [
      {
        id: 'obra-lon-01',
        codigo: 'OBR-LON-2024-01',
        titulo: 'Duplicação do Arco Norte e Acesso ao Parque Industrial de Londrina',
        secretaria: 'SMOP',
        secretariaNome: 'Secretaria Municipal de Obras e Pavimentação',
        status: 'Em Execução',
        valorPrevisto: 62000000,
        valorLiquidado: 46500000,
        progressoFisico: 75.0,
        progressoFinanceiro: 75.0,
        bairro: 'Zona Norte / Heimtal',
        regiao: 'Zona Norte',
        coordenadasSvg: { x: 460, y: 150 },
        coordenadasGeo: { lat: -23.2550, lng: -51.1550 },
        fonteRecurso: 'Paraná Cidade / Finisa',
        empresaContratada: 'Consórcio Norte de Pavimentação',
        numeroContrato: '033/2024-SMOP',
        dataInicio: '2024-02-20',
        dataPrevisaoFim: '2026-11-15',
        prazoDias: 998,
        diasDecorridos: 890,
        descricao: 'Pista dupla com acostamento, ciclovia e iluminação LED.',
        destaque: true,
        beneficiariosEstimados: 180000,
        impactoSocial: 'Escoamento de cargas e conexão com a PR-445 e BR-369.',
      },
      {
        id: 'obra-lon-02',
        codigo: 'OBR-LON-2024-02',
        titulo: 'Novo Pronto Atendimento Municipal e UBS Integrada Gleba Palhano',
        secretaria: 'SMSA',
        secretariaNome: 'Secretaria Municipal de Saúde',
        status: 'Em Execução',
        valorPrevisto: 28000000,
        valorLiquidado: 14000000,
        progressoFisico: 50.0,
        progressoFinanceiro: 50.0,
        bairro: 'Gleba Palhano / Zona Sul',
        regiao: 'Zona Sul',
        coordenadasSvg: { x: 520, y: 390 },
        coordenadasGeo: { lat: -23.3350, lng: -51.1850 },
        fonteRecurso: 'Tesouro Municipal',
        empresaContratada: 'Engenharia Londrinense Ltda',
        numeroContrato: '082/2024-SMSA',
        dataInicio: '2024-06-01',
        dataPrevisaoFim: '2027-01-30',
        prazoDias: 973,
        diasDecorridos: 790,
        descricao: 'Estrutura completa com 20 leitos de observação e raio-x digital.',
        destaque: true,
        beneficiariosEstimados: 90000,
        impactoSocial: 'Atendimento de urgência para a região de maior expansão populacional.',
      },
    ];
  } else {
    // Dynamic works for any municipality
    const obraVal1 = Math.round(total * 0.035);
    const obraVal2 = Math.round(total * 0.022);
    obras = [
      {
        id: `obra-${tenant.codigoIbge}-01`,
        codigo: `OBR-${tenant.cidade.substring(0, 3).toUpperCase()}-2024-01`,
        titulo: `Pavimentação Asfáltica e Drenagem Urbana nos Bairros de ${tenant.cidade}`,
        secretaria: 'SMOP',
        secretariaNome: 'Secretaria Municipal de Obras Públicas',
        status: 'Em Execução',
        valorPrevisto: obraVal1,
        valorLiquidado: Math.round(obraVal1 * 0.68),
        progressoFisico: 68.0,
        progressoFinanceiro: 68.0,
        bairro: 'Centro e Bairros Integrados',
        regiao: 'Área Urbana',
        coordenadasSvg: { x: 450, y: 250 },
        coordenadasGeo: { lat: -25.4000, lng: -49.3000 },
        fonteRecurso: 'Paraná Cidade / Finisa',
        empresaContratada: `Construtora Regional de ${tenant.cidade}`,
        numeroContrato: '015/2024-SMOP',
        dataInicio: '2024-03-01',
        dataPrevisaoFim: '2026-12-31',
        prazoDias: 1035,
        diasDecorridos: 880,
        descricao: `Pavimentação asfáltica, meio-fio, drenagem pluvial e sinalização viária em vias urbanas de ${tenant.cidade}.`,
        destaque: true,
        beneficiariosEstimados: Math.round((tenant.populacaoEstimada || 50000) * 0.6),
        impactoSocial: 'Melhoria na mobilidade urbana e valorização imobiliária dos bairros.',
      },
      {
        id: `obra-${tenant.codigoIbge}-02`,
        codigo: `OBR-${tenant.cidade.substring(0, 3).toUpperCase()}-2024-02`,
        titulo: `Reforma e Ampliação da Unidade Básica de Saúde Central de ${tenant.cidade}`,
        secretaria: 'SMSA',
        secretariaNome: 'Secretaria Municipal de Saúde',
        status: 'Em Execução',
        valorPrevisto: obraVal2,
        valorLiquidado: Math.round(obraVal2 * 0.55),
        progressoFisico: 55.0,
        progressoFinanceiro: 55.0,
        bairro: 'Bairro Central',
        regiao: 'Área Central',
        coordenadasSvg: { x: 520, y: 210 },
        coordenadasGeo: { lat: -25.4100, lng: -49.2900 },
        fonteRecurso: 'Fundo Municipal de Saúde / MS',
        empresaContratada: 'Engenharia e Obras Públicas Ltda',
        numeroContrato: '028/2024-SMSA',
        dataInicio: '2024-04-10',
        dataPrevisaoFim: '2026-11-30',
        prazoDias: 964,
        diasDecorridos: 830,
        descricao: `Ampliação da sala de vacinas, consultórios odontológicos e farmácia básica municipal.`,
        destaque: true,
        beneficiariosEstimados: Math.round((tenant.populacaoEstimada || 50000) * 0.4),
        impactoSocial: 'Capacidade ampliada para atendimentos primários de saúde pública.',
      },
    ];
  }

  const totalInvestimento = obras.reduce((acc, o) => acc + o.valorPrevisto, 0);
  const totalLiquidado = obras.reduce((acc, o) => acc + o.valorLiquidado, 0);
  const percentualGeral = totalInvestimento > 0 ? Number(((totalLiquidado / totalInvestimento) * 100).toFixed(1)) : 0;

  const summary = {
    totalObras: obras.length,
    totalInvestimento,
    totalLiquidado,
    percentualExecucaoGeral: percentualGeral,
    obrasEmExecucao: obras.filter(o => o.status === 'Em Execução').length,
    obrasConcluidas: obras.filter(o => o.status === 'Concluída').length,
    obrasLicitacao: obras.filter(o => o.status === 'Em Licitação').length,
    obrasAtrasadas: obras.filter(o => o.status === 'Atrasada').length,
  };

  return { obras, summary };
}

// 9. Siconfi Status
export function getMunicipalSiconfiStatus(tenant: TenantInfo, latencyMs: number = 240, online: boolean = true) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  return {
    online,
    endpoint: 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/',
    lastChecked: new Date().toISOString(),
    latencyMs,
    enteNome: tenant.nomePrefeitura,
    enteCodIbge: tenant.codigoIbge,
    uf: tenant.uf,
    populacaoIBGE: tenant.populacaoEstimada || 151666,
    pibPerCapita: profile.orcamento / (tenant.populacaoEstimada || 151666),
    baseIndustrial: profile.perfilEconomico,
    cacheEntries: 12,
  };
}

// 10. Painel do Prefeito (Visão Executiva Resumida)
export function getPainelPrefeito(tenant: TenantInfo, ano: number = 2026) {
  const profile = getMunicipalFinancialProfile(tenant, ano);
  const rcl = profile.rcl;
  const pessoalPct = profile.despesaPessoalPct;
  const gastoAtualPessoal = Math.round(rcl * (pessoalPct / 100));

  const limiteAlertaReais = Math.round(rcl * 0.486);
  const limitePrudencialReais = Math.round(rcl * 0.513);
  const limiteLegalReais = Math.round(rcl * 0.540);

  const margemAtePrudencialReais = limitePrudencialReais - gastoAtualPessoal;
  const margemAteLegalReais = limiteLegalReais - gastoAtualPessoal;

  // Semáforo Fiscal Geral
  let semaforo: 'VERDE' | 'AMARELO' | 'VERMELHO' = 'VERDE';
  let semaforoMotivo = 'Contas sob controle rigoroso e limites constitucionais cumpridos.';
  if (pessoalPct >= 54.0) {
    semaforo = 'VERMELHO';
    semaforoMotivo = 'Alerta Crítico: Limite Legal da LRF ultrapassado ou déficit orçamentário iminente.';
  } else if (pessoalPct >= 48.6) {
    semaforo = 'AMARELO';
    semaforoMotivo = 'Atenção: Folha ultrapassou limite de alerta (48,6%) e queda de repasses estaduais.';
  }

  // Caixa Disponível
  const caixaTotal = Math.round(profile.orcamento * 0.125);
  const caixaLivre = Math.round(caixaTotal * 0.38);
  const caixaVinculado = caixaTotal - caixaLivre;

  // Captação & Emendas
  const metaCaptacao = Math.round(profile.orcamento * 0.065);
  const captacaoRealizada = Math.round(metaCaptacao * 0.632);
  const captacaoPct = Number(((captacaoRealizada / metaCaptacao) * 100).toFixed(1));

  // Top 3 Decisões Urgentes da Semana contextualizadas
  const decisoesUrgentes = [
    {
      id: 'decisao-1',
      prioridade: 'ALTA',
      categoria: 'FOLHA DE PESSOAL',
      titulo: 'Controle de Horas Extras e Cargos em Comissão',
      descricao: `A folha está em ${pessoalPct}% da RCL. ${margemAtePrudencialReais >= 0 ? `Resta uma folga de ${Math.round(margemAtePrudencialReais / 1_000_000)}M até o limite prudencial.` : `Ultrapassou em ${Math.round(Math.abs(margemAtePrudencialReais) / 1_000_000)}M o limite prudencial.`}`,
      impactoFinanceiro: `R$ ${(Math.abs(margemAtePrudencialReais) * 0.15 / 1_000_000).toFixed(1)}M/ano`,
      acaoSugerida: 'Publicar Decreto Municipal restringindo concessão de novas gratificações e horas extras.',
      prazoDias: 5,
    },
    {
      id: 'decisao-2',
      prioridade: 'ALTA',
      categoria: 'RECEITAS & ICMS',
      titulo: 'Revisão da Cota-Parte do ICMS e Ação Judicial / Administrativa',
      descricao: `Queda estimada de 12% no repasse do ICMS estadual para ${tenant.cidade}. Necessário envio de auditoria ao Estado.`,
      impactoFinanceiro: `R$ ${(profile.orcamento * 0.035 / 1_000_000).toFixed(1)}M`,
      acaoSugerida: 'Acionar Procuradoria Geral do Município para contestar o IPM (Índice de Participação dos Municípios).',
      prazoDias: 7,
    },
    {
      id: 'decisao-3',
      prioridade: 'MEDIA',
      categoria: 'CONVÊNIOS & CAPTAÇÃO',
      titulo: 'Homologação e Desbloqueio de Emendas Parlamentares Federais',
      descricao: `3 propostas cadastradas no Transferegov aguardando complementação documental de engenharia.`,
      impactoFinanceiro: `R$ ${(metaCaptacao * 0.22 / 1_000_000).toFixed(1)}M`,
      acaoSugerida: 'Determinar à Secretaria de Planejamento o envio dos projetos executivos para a Caixa.',
      prazoDias: 10,
    },
  ];

  return {
    ano,
    municipio: {
      nome: tenant.nomePrefeitura,
      cidade: tenant.cidade,
      uf: tenant.uf,
      codigoIbge: tenant.codigoIbge,
    },
    semaforo: {
      status: semaforo,
      motivo: semaforoMotivo,
    },
    caixaDisponivel: {
      total: caixaTotal,
      recursosLivres: caixaLivre,
      recursosVinculados: caixaVinculado,
    },
    margemFolha: {
      gastoAtual: gastoAtualPessoal,
      percentualRCL: pessoalPct,
      limiteAlertaValor: limiteAlertaReais,
      limitePrudencialValor: limitePrudencialReais,
      limiteLegalValor: limiteLegalReais,
      margemAtePrudencialReais,
      margemAteLegalReais,
      status: pessoalPct > 54 ? 'CRITICO' : pessoalPct > 51.3 ? 'PRUDENCIAL' : pessoalPct > 48.6 ? 'ALERTA' : 'REGULAR',
    },
    captacao: {
      metaAnual: metaCaptacao,
      realizado: captacaoRealizada,
      percentual: captacaoPct,
    },
    decisoesUrgentes,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `Painel Executivo Municipal / LOA ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}

// 11. Radar de Captação & Elegibilidade
export function getMunicipalRadarCaptacao(tenant: TenantInfo) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const now = new Date();

  const addDays = (d: number) => {
    const target = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  };

  const isCapagA = tenant.codigoIbge === '4101804' || tenant.codigoIbge === '4106902' || tenant.codigoIbge === '4115200';

  const programas: any[] = [
    {
      id: 'prog-transf-01',
      codigoPrograma: '3600020260012',
      orgaoConcedente: 'Fundo Nacional de Saúde (FNS)',
      ministerio: 'Saúde',
      titulo: 'Estruturação da Rede de Serviços de Atenção Primária à Saúde — UBS Porte III',
      areaTematica: 'Construção e Equipamentos de Saúde',
      objeto: `Construção, ampliação e reforma de Unidades Básicas de Saúde (UBS) e aquisição de equipamentos odontológicos e médicos em ${tenant.cidade}.`,
      valorMinimo: 850000,
      valorMaximo: 4500000,
      percentualContrapartidaMinima: 2.0,
      dataInicioInscricao: '2026-01-15',
      dataFimInscricao: addDays(12),
      diasRestantes: 12,
      statusPrazo: 'MODERADO',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['CAUC 100% adimplente', 'CAPAG compatível (A/B)', 'Piso constitucional da Saúde (21,8%) superado'],
        capagMinima: 'B',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br/portal/consultarPrograma/3600020260012',
    },
    {
      id: 'prog-transf-02',
      codigoPrograma: '5600020260005',
      orgaoConcedente: 'Ministério das Cidades / Caixa',
      ministerio: 'Cidades / Infraestrutura',
      titulo: 'Programa Avançar Cidades — Pavimentação, Drenagem e Acessibilidade Urbana',
      areaTematica: 'Infraestrutura Urbana e Mobilidade',
      objeto: `Execução de obras de drenagem pluvial, pavimentação asfáltica de vias coletoras e implantação de calçadas acessíveis em bairros periféricos de ${tenant.cidade}.`,
      valorMinimo: 2000000,
      valorMaximo: 25000000,
      percentualContrapartidaMinima: 5.0,
      dataInicioInscricao: '2026-02-01',
      dataFimInscricao: addDays(6),
      diasRestantes: 6,
      statusPrazo: 'URGENTE',
      elegibilidade: {
        status: isCapagA ? 'ELEGIVEL' : 'RESTRICAO',
        motivos: isCapagA
          ? ['Capacidade de endividamento LRF comprovada (12,8% DCL)', 'Plano Diretor Municipal atualizado']
          : ['Necessária autorização legislativa para contrapartida de grande porte'],
        capagMinima: 'A',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br/portal/consultarPrograma/5600020260005',
    },
    {
      id: 'prog-transf-03',
      codigoPrograma: '2600020260088',
      orgaoConcedente: 'Fundo Nacional de Desenvolvimento da Educação (FNDE)',
      ministerio: 'Educação',
      titulo: 'Construção de Creches e Centros de Educação Infantil — Proinfância Tipo 1',
      areaTematica: 'Educação Infantil e Primeira Infância',
      objeto: `Construção de Centro Municipal de Educação Infantil (CMEI) com capacidade para atendimento de 376 crianças em dois turnos em ${tenant.cidade}.`,
      valorMinimo: 3200000,
      valorMaximo: 8900000,
      percentualContrapartidaMinima: 1.0,
      dataInicioInscricao: '2026-01-20',
      dataFimInscricao: addDays(28),
      diasRestantes: 28,
      statusPrazo: 'MODERADO',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['Cumprimento de 27,4% em MDE (Piso 25%)', 'Terreno com registro imobiliário regularizado'],
        capagMinima: 'B',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br/portal/consultarPrograma/2600020260088',
    },
    {
      id: 'prog-transf-04',
      codigoPrograma: '4400020260019',
      orgaoConcedente: 'Ministério do Meio Ambiente e Mudança do Clima',
      ministerio: 'Meio Ambiente',
      titulo: 'Cidades Verdes e Resilientes — Gestão de Resíduos Sólidos e Ecopontos',
      areaTematica: 'Saneamento e Meio Ambiente',
      objeto: `Implantação de Usina de Triagem Mecanizada de Resíduos e ecopontos inteligentes em ${tenant.cidade}.`,
      valorMinimo: 1200000,
      valorMaximo: 6000000,
      percentualContrapartidaMinima: 3.0,
      dataInicioInscricao: '2026-02-10',
      dataFimInscricao: addDays(45),
      diasRestantes: 45,
      statusPrazo: 'CONFORTAVEL',
      elegibilidade: {
        status: 'ELEGIVEL',
        motivos: ['Licenciamento prévio emitido pelo órgão ambiental', 'Consórcio intermunicipal aderido'],
        capagMinima: 'C',
        caucExigido: true,
      },
      linkTransferegov: 'https://transferegov.sistema.gov.br/portal/consultarPrograma/4400020260019',
    },
  ];

  const totalPotencial = programas.reduce((acc, p) => acc + p.valorMaximo, 0);

  return {
    municipio: {
      nome: tenant.nomePrefeitura,
      cidade: tenant.cidade,
      uf: tenant.uf,
      codigoIbge: tenant.codigoIbge,
    },
    resumo: {
      totalProgramasAbertos: programas.length,
      programasElegiveis: programas.filter(p => p.elegibilidade.status === 'ELEGIVEL').length,
      potencialGlobalCaptacao: totalPotencial,
      programasUrgentesPrazo: programas.filter(p => p.statusPrazo === 'URGENTE').length,
      caucStatus: 'ADIMPLENTE_100',
      capagScore: isCapagA ? 'A (Capacidade Plena)' : 'B (Capacidade Regular)',
    },
    programas,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `Radar de Oportunidades Transferegov / ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}

export function simularContrapartida(tenant: TenantInfo, valorGlobal: number, percentualContrapartida: number = 5.0) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const caixaLivre = Math.round(profile.orcamento * 0.125 * 0.38);

  const pct = Math.max(1.0, Math.min(50.0, percentualContrapartida));
  const valorContrapartida = Math.round(valorGlobal * (pct / 100));
  const valorRepasse = valorGlobal - valorContrapartida;

  const impactoPct = Number(((valorContrapartida / caixaLivre) * 100).toFixed(2));

  let viabilidade: 'ALTA' | 'MODERADA' | 'CRITICA' = 'ALTA';
  let recomendacao = `Contrapartida de R$ ${(valorContrapartida / 1_000_000).toFixed(2)}M representa ${impactoPct}% do caixa livre municipal. Plena viabilidade financeira sem risco à folha.`;

  if (impactoPct > 25.0) {
    viabilidade = 'CRITICA';
    recomendacao = `Atenção: A contrapartida consome ${impactoPct}% da reserva livre da prefeitura. Recomendado solicitar redução do percentual ou parcelamento de desembolso na LDO.`;
  } else if (impactoPct > 10.0) {
    viabilidade = 'MODERADA';
    recomendacao = `Contrapartida requer reserva prévia de dotação orçamentária na Secretaria de Planejamento.`;
  }

  return {
    valorGlobal,
    percentualContrapartida: pct,
    valorRepasseFederal: valorRepasse,
    valorContrapartidaMunicipal: valorContrapartida,
    saldoCaixaLivreDisponivel: caixaLivre,
    impactoCaixaLivrePercentual: impactoPct,
    viabilidade,
    recomendacaoTecnica: recomendacao,
  };
}

// 12. Simulador de Reforma Tributária (EC 132/2023 - Transição ICMS/ISS para IBS)
export function getMunicipalSimuladorReforma(tenant: TenantInfo, variacaoArrecadacaoPropriaPct: number = 0) {
  const profile = getMunicipalFinancialProfile(tenant, 2026);
  const baseOrcamento = profile.orcamento;

  const isIndustrial = profile.perfilEconomico.includes('Industrial') || tenant.codigoIbge === '4101804';
  const isCapitalOuMetropole = tenant.codigoIbge === '4106902' || tenant.codigoIbge === '4113700';

  // Fator Destino vs Origem:
  // Se é polo industrial exportador, perde cota de valor adicionado na origem e ganha por população
  // Se é capital consumidora/serviços, ganha por destino
  const fatorIbsDestino = isIndustrial ? 0.82 : isCapitalOuMetropole ? 1.08 : 0.96;

  const icmsBase2026 = Math.round(baseOrcamento * (isIndustrial ? 0.38 : 0.22));
  const issBase2026 = Math.round(baseOrcamento * (isCapitalOuMetropole ? 0.25 : 0.12));

  const anosTransicao = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

  const fasesNomes: Record<number, string> = {
    2026: 'Início de Teste Alíquota 0,1% IBS',
    2027: 'Entrada da CBS Federal / Ajuste Alíquotas',
    2028: 'Homologação Comitê Gestor do IBS',
    2029: 'Início Redução ICMS/ISS (-10% / IBS 10%)',
    2030: 'Redução ICMS/ISS (-20% / IBS 20%)',
    2031: 'Redução ICMS/ISS (-30% / IBS 30%)',
    2032: 'Redução ICMS/ISS (-40% / IBS 40%)',
    2033: 'Extinção do ICMS/ISS • Pleno IBS Destino',
  };

  const pctSubstituicaoIbs: Record<number, number> = {
    2026: 0.0,
    2027: 0.02,
    2028: 0.05,
    2029: 0.10,
    2030: 0.20,
    2031: 0.30,
    2032: 0.40,
    2033: 1.0,
  };

  let perdaOuGanhoTotal = 0;

  const projecoes = anosTransicao.map((ano, index) => {
    // Crescimento vegetativo da economia estimado em 2.5% a.a.
    const fatorCrescimento = Math.pow(1.025, index);

    const icmsSem = Math.round(icmsBase2026 * fatorCrescimento);
    const issSem = Math.round(issBase2026 * fatorCrescimento);
    const receitaSem = icmsSem + issSem;

    const pctIbs = pctSubstituicaoIbs[ano];
    const pctMantido = 1.0 - pctIbs;

    const icmsCom = Math.round(icmsSem * pctMantido);
    const issCom = Math.round(issSem * pctMantido);

    // IBS projetado com base no princípio do destino
    const ibsCalculado = Math.round((icmsSem + issSem) * pctIbs * fatorIbsDestino);

    // Regra do Fundo de Compensação de Perdas da EC 132 (Art. 131 ADCT)
    // Garante 100% da média histórica corrigida nos primeiros anos para entes perdedores
    let fundoCompensacao = 0;
    const receitaComBruta = icmsCom + issCom + ibsCalculado;
    if (receitaComBruta < receitaSem) {
      // Cobertura pelo Fundo de Transição Federativo (100% até 2030, 80% até 2033)
      const taxaCobertura = ano <= 2030 ? 0.90 : 0.70;
      fundoCompensacao = Math.round((receitaSem - receitaComBruta) * taxaCobertura);
    }

    // Impacto do ajuste de arrecadação própria simulado
    const ajusteProprio = Math.round(receitaSem * (variacaoArrecadacaoPropriaPct / 100));
    const receitaCom = icmsCom + issCom + ibsCalculado + fundoCompensacao + ajusteProprio;

    const diferencaNominal = receitaCom - receitaSem;
    const diferencaPercentual = Number(((diferencaNominal / receitaSem) * 100).toFixed(2));

    perdaOuGanhoTotal += diferencaNominal;

    return {
      ano,
      icmsSemReforma: icmsSem,
      issSemReforma: issSem,
      ibsProjetado: ibsCalculado,
      fundoCompensacaoFederativo: fundoCompensacao,
      receitaTotalSemReforma: receitaSem,
      receitaTotalComReforma: receitaCom,
      diferencaNominal,
      diferencaPercentual,
      faseTransicao: fasesNomes[ano],
    };
  });

  const medidasCompensatorias: any[] = [
    {
      id: 'medida-1',
      titulo: 'Atualização da Planta Genérica de Valores (PGV) e Georreferenciamento de Imóveis',
      categoria: 'IPTU',
      impactoAnualEstimado: Math.round(baseOrcamento * 0.028),
      complexidade: 'MEDIA',
      prazoMeses: 12,
      descricao: `Revisão do cadastro imobiliário com sobrevoo e inteligência artificial para identificar ampliações prediais não averbadas em ${tenant.cidade}.`,
      acaoPratica: 'Encaminhar Projeto de Lei Complementar à Câmara Municipal revisando a PGV e lançando recadastramento digital.',
    },
    {
      id: 'medida-2',
      titulo: 'Modernização e Expansão da CIP / COSIP (Iluminação Pública Inteligente)',
      categoria: 'CIP / COSIP',
      impactoAnualEstimado: Math.round(baseOrcamento * 0.012),
      complexidade: 'BAIXA',
      prazoMeses: 6,
      descricao: `Adesão a PPP de telegestão em LED e reajuste da base tarifária da contribuição de iluminação pública conforme STF (Tema 696).`,
      acaoPratica: 'Publicar Decreto regulamentando a taxa de custeio e eficiência energética.',
    },
    {
      id: 'medida-3',
      titulo: 'Programa de Recuperação Fiscal (REFIS) e Cobrança Extrajudicial de Dívida Ativa',
      categoria: 'DÍVIDA ATIVA',
      impactoAnualEstimado: Math.round(baseOrcamento * 0.022),
      complexidade: 'BAIXA',
      prazoMeses: 4,
      descricao: `Protesto de CDA em cartórios de títulos e protestos e parcelamento incentivado de débitos de IPTU/ISS.`,
      acaoPratica: 'Firmar convênio com Instituto de Estudos de Protesto de Títulos do Brasil (IEPTB).',
    },
    {
      id: 'medida-4',
      titulo: 'Auditoria de ISSQN sobre Instituições Financeiras e Plataformas Digitais (DIF-e)',
      categoria: 'ISSQN',
      impactoAnualEstimado: Math.round(baseOrcamento * 0.018),
      complexidade: 'MEDIA',
      prazoMeses: 8,
      descricao: `Cruzamento de dados da Declaração de Informações Fiscais dos Bancos (DES-IF) para apurar subdeclaração de tarifas bancárias e cartões de crédito.`,
      acaoPratica: 'Contratar módulo de inteligência fiscal bancária para a Secretaria de Finanças.',
    },
  ];

  return {
    municipio: {
      nome: tenant.nomePrefeitura,
      cidade: tenant.cidade,
      uf: tenant.uf,
      codigoIbge: tenant.codigoIbge,
      perfilEconomico: profile.perfilEconomico,
    },
    resumo: {
      perdaOuGanhoAcumulado2033: perdaOuGanhoTotal,
      anoPicoImpacto: 2033,
      mediaVariacaoAnualPct: Number(((perdaOuGanhoTotal / (icmsBase2026 * 8)) * 100).toFixed(2)),
      recomendacaoGeral: isIndustrial
        ? `Município com forte base industrial (VAF na origem). Recomenda-se acionar o Comitê Gestor do IBS para assegurar retenção federativa e implementar o Plano de Medidas Compensatórias de IPTU e ISS.`
        : `Município com economia de serviços e perfil consumidor. Ganho gradual de arrecadação no IBS com a migração para o princípio do destino.`,
      fatorDestinoConsumo: fatorIbsDestino,
    },
    projecoes,
    medidasCompensatorias,
    dataSource: {
      origin: 'DEMONSTRACAO',
      source: `Simulador Reforma Tributária EC 132/2023 / STN / IPEA / ${tenant.cidade}`,
      collectedAt: new Date().toISOString(),
      confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
    },
  };
}
