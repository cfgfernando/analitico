/**
 * Seed de Demonstração — Painel Gerencial de Saúde Financeira Municipal
 * Município: Araucária (IBGE 4101804)
 * Todos os dados marcados como [DEMONSTRAÇÃO · seed de teste]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randDecimal(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// Gera série histórica jul/2024 → jul/2026 (25 meses)
function gerarSerie(baseValorMensal: number, crescimentoAnual: number) {
  const serie: { mes: number; ano: number; valor: number }[] = [];
  const sazonalidade = [1.0, 0.85, 0.88, 0.92, 0.95, 1.10, 1.05, 1.0, 0.98, 1.02, 1.08, 1.15];
  let mes = 7; let ano = 2024;
  for (let i = 0; i < 25; i++) {
    const fator = Math.pow(1 + crescimentoAnual, i / 12) * sazonalidade[mes - 1] * (0.92 + Math.random() * 0.16);
    serie.push({ mes, ano, valor: Math.max(1000, Math.round(baseValorMensal * fator)) });
    mes++; if (mes > 12) { mes = 1; ano++; }
  }
  return serie;
}

const REGRAS = [
  { categoria: 'VIGILANCIA',          criticidade: 'ESSENCIAL',   descricao: 'Segurança patrimonial ininterrupta' },
  { categoria: 'SAUDE_SERVICOS',      criticidade: 'ESSENCIAL',   descricao: 'Serviços de saúde contínuos' },
  { categoria: 'COMBUSTIVEL',         criticidade: 'ESSENCIAL',   descricao: 'Combustível para frota essencial' },
  { categoria: 'FOLHA_TERCEIRIZADOS', criticidade: 'ESSENCIAL',   descricao: 'Mão de obra essencial terceirizada' },
  { categoria: 'LIMPEZA',             criticidade: 'IMPORTANTE',  descricao: 'Limpeza e higienização' },
  { categoria: 'MANUTENCAO_PREDIAL',  criticidade: 'IMPORTANTE',  descricao: 'Conservação das estruturas físicas' },
  { categoria: 'MANUTENCAO_VEICULOS', criticidade: 'IMPORTANTE',  descricao: 'Manutenção da frota municipal' },
  { categoria: 'SOFTWARE_LICENCAS',   criticidade: 'IMPORTANTE',  descricao: 'Licenças de sistemas e software' },
  { categoria: 'TELEFONIA',           criticidade: 'IMPORTANTE',  descricao: 'Telecomunicações' },
  { categoria: 'CONSULTORIA',         criticidade: 'DIFERIVEL',   descricao: 'Consultorias externas' },
  { categoria: 'COPA_COZINHA',        criticidade: 'DIFERIVEL',   descricao: 'Copa e alimentação' },
  { categoria: 'LOCACAO_VEICULOS',    criticidade: 'DIFERIVEL',   descricao: 'Locação de veículos não essenciais' },
  { categoria: 'MATERIAL_ESCRITORIO', criticidade: 'DIFERIVEL',   descricao: 'Material de escritório' },
  { categoria: 'IMPRESSAO',           criticidade: 'DIFERIVEL',   descricao: 'Impressão e reprografia' },
  { categoria: 'OBRAS_PEQUENAS',      criticidade: 'DIFERIVEL',   descricao: 'Pequenas obras não urgentes' },
];

const ORC = 1_200_000_000;
const SECRETARIAS = [
  { codigo: 'SAUDE',      nome: 'Secretaria Municipal de Saúde',              pct: 0.28 },
  { codigo: 'EDUCACAO',   nome: 'Secretaria Municipal de Educação',            pct: 0.24 },
  { codigo: 'OBRAS',      nome: 'Secretaria Municipal de Obras Públicas',      pct: 0.16 },
  { codigo: 'ADMIN',      nome: 'Secretaria Municipal de Administração',       pct: 0.12 },
  { codigo: 'ASSISTENCIA',nome: 'Secretaria Municipal de Assistência Social',  pct: 0.09 },
];

type C = {
  num: string; emp: string; obj: string; cat: string; val: number; liqPct: number;
  crit: 'ESSENCIAL'|'IMPORTANTE'|'DIFERIVEL'; imp: 'ALTO'|'MEDIO'|'BAIXO';
  social?: string; cresc: number; ini: Date; fim: Date;
};

const CONTRATOS: Record<string, C[]> = {
  SAUDE: [
    { num:'001/2025', emp:'Vigilância Ativa Ltda', obj:'Vigilância armada nas UBS e UPA', cat:'VIGILANCIA', val:2_800_000, liqPct:0.58, crit:'ESSENCIAL', imp:'ALTO', social:'120 postos | Segurança 24h em 8 unidades de saúde', cresc:0.22, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'002/2025', emp:'CleanMed Hospitalar', obj:'Limpeza e higienização hospitalar especializada', cat:'LIMPEZA', val:1_950_000, liqPct:0.52, crit:'IMPORTANTE', imp:'ALTO', social:'85 postos | Biossegurança nas unidades', cresc:0.10, ini:new Date('2025-02-01'), fim:new Date('2026-01-31') },
    { num:'003/2025', emp:'Pharma Distribuição S.A.', obj:'Medicamentos essenciais e insumos hospitalares', cat:'SAUDE_SERVICOS', val:8_500_000, liqPct:0.60, crit:'ESSENCIAL', imp:'ALTO', social:'45.000 pacientes/mês atendidos', cresc:0.18, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'004/2025', emp:'TechHealth Sistemas', obj:'Sistema de prontuário eletrônico (PEP)', cat:'SOFTWARE_LICENCAS', val:420_000, liqPct:0.45, crit:'IMPORTANTE', imp:'MEDIO', social:'Prontuário de 120.000 pacientes', cresc:0.08, ini:new Date('2025-03-01'), fim:new Date('2026-02-28') },
    { num:'005/2025', emp:'Combustex Distribuidora', obj:'Combustível para ambulâncias SAMU', cat:'COMBUSTIVEL', val:780_000, liqPct:0.48, crit:'ESSENCIAL', imp:'ALTO', social:'12 ambulâncias 24h', cresc:0.15, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'006/2025', emp:'ConsultSaúde Assessoria', obj:'Consultoria em gestão hospitalar', cat:'CONSULTORIA', val:240_000, liqPct:0.30, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.05, ini:new Date('2025-04-01'), fim:new Date('2025-12-31') },
    { num:'007/2025', emp:'Manutenção Geral LTDA', obj:'Manutenção de equipamentos médicos', cat:'MANUTENCAO_PREDIAL', val:660_000, liqPct:0.40, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.09, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
    { num:'008/2025', emp:'CaterMed Alimentação', obj:'Alimentação para pacientes internados', cat:'COPA_COZINHA', val:980_000, liqPct:0.55, crit:'IMPORTANTE', imp:'MEDIO', social:'180 pacientes/dia em internação', cresc:0.12, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
  ],
  EDUCACAO: [
    { num:'020/2025', emp:'EduVigilância Serviços', obj:'Vigilância escolar — ensino fundamental e médio', cat:'VIGILANCIA', val:1_800_000, liqPct:0.50, crit:'ESSENCIAL', imp:'ALTO', social:'96 postos | 22.000 alunos em 38 escolas', cresc:0.19, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'021/2025', emp:'LimpEdu Conservação', obj:'Limpeza das escolas municipais', cat:'LIMPEZA', val:3_200_000, liqPct:0.53, crit:'IMPORTANTE', imp:'ALTO', social:'140 postos de trabalho', cresc:0.11, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'022/2025', emp:'MerEndas Distribuidora', obj:'Merenda escolar — gêneros alimentícios', cat:'SAUDE_SERVICOS', val:4_800_000, liqPct:0.62, crit:'ESSENCIAL', imp:'ALTO', social:'22.000 alunos/dia alimentados', cresc:0.13, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'023/2025', emp:'TransEdu Transportes', obj:'Transporte escolar — zona rural', cat:'LOCACAO_VEICULOS', val:2_100_000, liqPct:0.55, crit:'ESSENCIAL', imp:'ALTO', social:'1.800 alunos da zona rural', cresc:0.16, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
    { num:'024/2025', emp:'SoftEdu Sistemas', obj:'Plataforma digital de ensino e gestão escolar', cat:'SOFTWARE_LICENCAS', val:380_000, liqPct:0.40, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.07, ini:new Date('2025-03-01'), fim:new Date('2026-02-28') },
    { num:'025/2025', emp:'PedagoCons Assessoria', obj:'Assessoria pedagógica e formação de professores', cat:'CONSULTORIA', val:190_000, liqPct:0.25, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.05, ini:new Date('2025-04-01'), fim:new Date('2025-12-31') },
    { num:'026/2025', emp:'Papelaria Central PR', obj:'Material pedagógico e de escritório', cat:'MATERIAL_ESCRITORIO', val:520_000, liqPct:0.60, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.04, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'027/2025', emp:'ManutEdu Engenharia', obj:'Manutenção predial das escolas', cat:'MANUTENCAO_PREDIAL', val:1_100_000, liqPct:0.35, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.09, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
  ],
  OBRAS: [
    { num:'040/2025', emp:'Construtora ObraSol', obj:'Pavimentação — Bairro Thomaz Coelho', cat:'OBRAS_PEQUENAS', val:3_800_000, liqPct:0.42, crit:'IMPORTANTE', imp:'ALTO', social:'Mobilidade para 12.000 moradores', cresc:0.08, ini:new Date('2025-03-01'), fim:new Date('2025-11-30') },
    { num:'041/2025', emp:'ViaFácil Locação', obj:'Locação de maquinário pesado para obras', cat:'LOCACAO_VEICULOS', val:1_400_000, liqPct:0.48, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.10, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'042/2025', emp:'Combustex Distribuidora', obj:'Combustível para maquinário de obras', cat:'COMBUSTIVEL', val:960_000, liqPct:0.55, crit:'ESSENCIAL', imp:'ALTO', social:'35 máquinas em operação', cresc:0.17, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'043/2025', emp:'EngConsult Projetos', obj:'Projetos executivos e estudos geotécnicos', cat:'CONSULTORIA', val:320_000, liqPct:0.28, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.05, ini:new Date('2025-04-01'), fim:new Date('2025-12-31') },
    { num:'044/2025', emp:'LimpUrb Ambiental', obj:'Varrição de logradouros públicos', cat:'LIMPEZA', val:2_600_000, liqPct:0.58, crit:'IMPORTANTE', imp:'MEDIO', social:'110 postos de trabalho em varrição', cresc:0.12, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'045/2025', emp:'AutoFleet Veículos', obj:'Manutenção da frota municipal de obras', cat:'MANUTENCAO_VEICULOS', val:480_000, liqPct:0.38, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.09, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
  ],
  ADMIN: [
    { num:'060/2025', emp:'Vigilância Corporativa PR', obj:'Vigilância eletrônica e física da Prefeitura', cat:'VIGILANCIA', val:480_000, liqPct:0.52, crit:'ESSENCIAL', imp:'MEDIO', social:'28 postos | Segurança patrimonial', cresc:0.20, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'061/2025', emp:'CleanOffice Serviços', obj:'Limpeza e copa do complexo administrativo', cat:'LIMPEZA', val:390_000, liqPct:0.55, crit:'IMPORTANTE', imp:'BAIXO', cresc:0.09, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'062/2025', emp:'InfoSystems Tecnologia', obj:'Suporte de TI e infraestrutura de rede', cat:'SOFTWARE_LICENCAS', val:560_000, liqPct:0.48, crit:'IMPORTANTE', imp:'MEDIO', social:'Sistemas de 800 servidores públicos', cresc:0.08, ini:new Date('2025-01-01'), fim:new Date('2026-12-31') },
    { num:'063/2025', emp:'TelecomNet PR', obj:'Telefonia fixa, móvel e internet', cat:'TELEFONIA', val:290_000, liqPct:0.60, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.06, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'064/2025', emp:'PrintMax Reprografia', obj:'Copiadoras e impressão', cat:'IMPRESSAO', val:180_000, liqPct:0.55, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.03, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'065/2025', emp:'Material Sul Distribuidora', obj:'Material de escritório e expediente', cat:'MATERIAL_ESCRITORIO', val:140_000, liqPct:0.65, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.04, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'066/2025', emp:'AutoLoc Premium', obj:'Locação de veículos para administração', cat:'LOCACAO_VEICULOS', val:320_000, liqPct:0.48, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.06, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
    { num:'067/2025', emp:'Café & Copa Premium', obj:'Insumos de copa e cozinha', cat:'COPA_COZINHA', val:85_000, liqPct:0.70, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.05, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
  ],
  ASSISTENCIA: [
    { num:'080/2025', emp:'SocialVigia Segurança', obj:'Vigilância nos CRAS e CREAS', cat:'VIGILANCIA', val:360_000, liqPct:0.50, crit:'ESSENCIAL', imp:'ALTO', social:'22 postos | Proteção de famílias vulneráveis', cresc:0.21, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'081/2025', emp:'CestoSocial Alimentos', obj:'Cestas básicas para famílias em vulnerabilidade', cat:'SAUDE_SERVICOS', val:1_200_000, liqPct:0.68, crit:'ESSENCIAL', imp:'ALTO', social:'2.400 famílias beneficiadas/mês', cresc:0.14, ini:new Date('2025-01-01'), fim:new Date('2025-12-31') },
    { num:'082/2025', emp:'TransAção Social', obj:'Transporte para beneficiários de serviços socioassistenciais', cat:'LOCACAO_VEICULOS', val:280_000, liqPct:0.42, crit:'IMPORTANTE', imp:'MEDIO', social:'800 pessoas com deficiência/mês', cresc:0.11, ini:new Date('2025-02-01'), fim:new Date('2025-12-31') },
    { num:'083/2025', emp:'ConsSocial Assessoria', obj:'Assessoria em políticas de assistência e SUAS', cat:'CONSULTORIA', val:160_000, liqPct:0.30, crit:'DIFERIVEL', imp:'BAIXO', cresc:0.05, ini:new Date('2025-04-01'), fim:new Date('2025-12-31') },
    { num:'084/2025', emp:'SoftSocial Sistemas', obj:'Sistema de gestão do SUAS e prontuário social', cat:'SOFTWARE_LICENCAS', val:110_000, liqPct:0.45, crit:'IMPORTANTE', imp:'MEDIO', cresc:0.07, ini:new Date('2025-03-01'), fim:new Date('2026-02-28') },
  ],
};

async function main() {
  console.log('🌱 Seed Painel Gerencial — Araucária (IBGE 4101804)...');

  let tenant = await prisma.tenant.findUnique({ where: { codigoIbge: '4101804' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        codigoIbge: '4101804', nomePrefeitura: 'Prefeitura Municipal de Araucária',
        cnpj: '76.105.574/0001-35', estadoUf: 'PR', cidade: 'Araucária',
        isDemonstracao: true, emailFaturamento: 'financeiro@araucaria.pr.gov.br',
        telefoneContato: '(41) 3614-1400',
      },
    });
  }
  const tenantId = tenant.id;

  for (const r of REGRAS) {
    await prisma.criticidadeRegra.upsert({
      where: { tenantId_categoria: { tenantId, categoria: r.categoria } },
      update: { criticidadePadrao: r.criticidade as any, descricao: r.descricao },
      create: { tenantId, categoria: r.categoria, criticidadePadrao: r.criticidade as any, descricao: r.descricao },
    });
  }
  console.log('✅ Regras de criticidade inseridas');

  for (const sec of SECRETARIAS) {
    const orcTotal = Math.round(ORC * sec.pct);
    const orcEmp  = Math.round(orcTotal * randDecimal(0.62, 0.72));
    const orcLiq  = Math.round(orcEmp * randDecimal(0.70, 0.82));
    const secretaria = await prisma.secretaria.upsert({
      where: { tenantId_codigo: { tenantId, codigo: sec.codigo } },
      update: { orcamentoTotal: orcTotal, orcamentoEmpenhado: orcEmp, orcamentoLiquidado: orcLiq },
      create: { tenantId, nome: sec.nome, codigo: sec.codigo, orcamentoTotal: orcTotal, orcamentoEmpenhado: orcEmp, orcamentoLiquidado: orcLiq },
    });
    console.log('🏛️ ' + sec.nome + ' — orçamento R$ ' + orcTotal.toLocaleString('pt-BR'));

    for (const c of (CONTRATOS[sec.codigo] || [])) {
      const liq = Math.round(c.val * c.liqPct);
      const disp = c.val - liq;
      const contratoId = `${tenantId}-${c.num}`;
      const contrato = await prisma.contrato.upsert({
        where: { id: contratoId },
        update: {},
        create: {
          id: contratoId, tenantId, secretariaId: secretaria.id,
          numero: c.num, empresa: c.emp, objeto: c.obj, categoria: c.cat,
          valorTotal: c.val, valorLiquidado: liq, valorDisponivel: disp,
          criticidade: c.crit as any, criticidadeFonte: 'AUTOMATICA',
          impactoMunicipal: c.imp as any, impactoSocial: c.social || null,
          dataInicio: c.ini, dataFim: c.fim, situacao: 'ATIVO', isDemonstracao: true,
        },
      });
      const serie = gerarSerie(Math.round(liq / 7), c.cresc);
      for (const p of serie) {
        await prisma.contratoGastoMensal.upsert({
          where: { contratoId_mes_ano: { contratoId: contrato.id, mes: p.mes, ano: p.ano } },
          update: { valorLiquidado: p.valor },
          create: { contratoId: contrato.id, mes: p.mes, ano: p.ano, valorLiquidado: p.valor },
        });
      }
    }
  }
  console.log('\n✅ Seed do Painel Gerencial concluído!');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
