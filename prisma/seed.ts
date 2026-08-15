import { PrismaClient, TenantStatus, UserRole, ApiProviderName, AuthType, FinancialCategory } from '@prisma/client';
import { MUNICIPIOS_REFERENCIA, generateApisForMunicipality } from '../src/data/municipiosBrasil';

const prisma = new PrismaClient();

async function main() {
  console.log('--- [PRISMA SEED: SAAS FISCAL MULTI-TENANT PARA PREFEITURAS (V4)] ---');

  const demoTenants = [
    {
      codigoIbge: '4101804',
      nomePrefeitura: 'Prefeitura Municipal de Araucária',
      cidade: 'Araucária',
      estadoUf: 'PR',
      cnpj: '76.105.535/0001-99',
      status: TenantStatus.ATIVO,
      planoNome: 'Plano Gestão Fiscal Completo',
      valorMensalBase: 1890.00,
      userLimit: 2,
      valorPorUsuarioExtra: 150.00,
      diaVencimento: 10,
      emailFaturamento: 'fazenda@araucaria.pr.gov.br',
      telefoneContato: '(41) 3614-1400',
      isDemonstracao: true,
    },
    {
      codigoIbge: '4106902',
      nomePrefeitura: 'Prefeitura Municipal de Curitiba',
      cidade: 'Curitiba',
      estadoUf: 'PR',
      cnpj: '76.417.005/0001-86',
      status: TenantStatus.ATIVO,
      planoNome: 'Plano Capital & Metrópole',
      valorMensalBase: 3490.00,
      userLimit: 2,
      valorPorUsuarioExtra: 150.00,
      diaVencimento: 15,
      emailFaturamento: 'financas@curitiba.pr.gov.br',
      telefoneContato: '(41) 3350-8484',
      isDemonstracao: true,
    },
    {
      codigoIbge: '4113700',
      nomePrefeitura: 'Prefeitura Municipal de Londrina',
      cidade: 'Londrina',
      estadoUf: 'PR',
      cnpj: '75.771.477/0001-70',
      status: TenantStatus.ATIVO,
      planoNome: 'Plano Básico Municipal',
      valorMensalBase: 1890.00,
      userLimit: 2,
      valorPorUsuarioExtra: 150.00,
      diaVencimento: 10,
      emailFaturamento: 'fazenda@londrina.pr.gov.br',
      telefoneContato: '(43) 3372-4000',
      isDemonstracao: true,
    },
    {
      codigoIbge: '4115200',
      nomePrefeitura: 'Prefeitura Municipal de Maringá',
      cidade: 'Maringá',
      estadoUf: 'PR',
      cnpj: '76.282.656/0001-06',
      status: TenantStatus.ATIVO,
      planoNome: 'Plano Básico Municipal',
      valorMensalBase: 1890.00,
      userLimit: 2,
      valorPorUsuarioExtra: 150.00,
      diaVencimento: 20,
      emailFaturamento: 'contabilidade@maringa.pr.gov.br',
      telefoneContato: '(44) 3221-1234',
      isDemonstracao: true,
    },
  ];

  for (const tenantData of demoTenants) {
    console.log(`Seeding tenant: ${tenantData.nomePrefeitura} (${tenantData.codigoIbge})...`);
    const tenant = await prisma.tenant.upsert({
      where: { codigoIbge: tenantData.codigoIbge },
      update: tenantData,
      create: tenantData,
    });

    // 1. Cria os 2 usuários padrão do município (Prefeito e Secretário)
    await prisma.user.upsert({
      where: { email: `gabinete.prefeito@${tenant.cidade.toLowerCase()}.pr.gov.br` },
      update: {},
      create: {
        tenantId: tenant.id,
        nomeCompleto: `Prefeito(a) de ${tenant.cidade}`,
        email: `gabinete.prefeito@${tenant.cidade.toLowerCase()}.pr.gov.br`,
        cpf: `000.${tenant.codigoIbge.substring(0, 3)}.000-01`,
        senhaHash: '$2b$10$defaultHashForDemoOnly1234567890',
        role: UserRole.PREFEITO,
        cargo: 'Prefeito Municipal',
        ativo: true,
        isExtra: false,
      },
    });

    await prisma.user.upsert({
      where: { email: `secretario.financas@${tenant.cidade.toLowerCase()}.pr.gov.br` },
      update: {},
      create: {
        tenantId: tenant.id,
        nomeCompleto: `Secretário(a) de Finanças de ${tenant.cidade}`,
        email: `secretario.financas@${tenant.cidade.toLowerCase()}.pr.gov.br`,
        cpf: `000.${tenant.codigoIbge.substring(0, 3)}.000-02`,
        senhaHash: '$2b$10$defaultHashForDemoOnly1234567890',
        role: UserRole.SECRETARIO_FINANCAS,
        cargo: 'Secretário de Finanças',
        ativo: true,
        isExtra: false,
      },
    });

    // 2. Provisiona APIs padrão
    const apis = generateApisForMunicipality(tenant.cidade, tenant.estadoUf, tenant.codigoIbge);
    for (const api of apis) {
      await prisma.tenantApiConfig.create({
        data: {
          tenantId: tenant.id,
          providerName: api.providerName as ApiProviderName,
          label: api.label,
          baseUrl: api.baseUrl,
          authType: AuthType.NONE,
          syncFrequency: '0 6,18 * * *',
          ativo: true,
          totalRegistrosSincronizados: 1500,
        },
      });
    }

    // 3. Registros financeiros de demonstração
    await prisma.financialRecord.createMany({
      data: [
        {
          tenantId: tenant.id,
          sourceKey: 'SICONFI_RREO',
          exercicioAno: 2026,
          periodo: 'ANUAL',
          categoria: FinancialCategory.RECEITA,
          accountCode: 'REC_TOTAL',
          accountName: 'Receita Total Orçada e Realizada',
          valor: 1850000000.00,
          isDemonstracao: true,
        },
        {
          tenantId: tenant.id,
          sourceKey: 'SICONFI_RGF',
          exercicioAno: 2026,
          periodo: 'ANUAL',
          categoria: FinancialCategory.RGF,
          accountCode: 'DTP_TOTAL',
          accountName: 'Despesa Total com Pessoal (DTP)',
          valor: 720000000.00,
          isDemonstracao: true,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✓ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
