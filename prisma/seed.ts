import { PrismaClient, TenantStatus, UserRole, ApiProviderName, AuthType, FinancialCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { generateApisForMunicipality } from '../src/data/municipiosBrasil';

const prisma = new PrismaClient();

// Hash bcrypt para "senha123"
const SENHA_HASH_PADRAO = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ek5Y9mF4mXwEa4khe';

async function main() {
  console.log('=== [PRISMA SEED: SAAS FISCAL MULTI-TENANT PARA PREFEITURAS (V4)] ===');

  // 1. TENANT MASTER (Administrador da Plataforma)
  const masterTenant = await prisma.tenant.upsert({
    where: { codigoIbge: '0000000' },
    update: {
      nomePrefeitura: 'Escrita.Online Sistemas e Soluções Tecnológicas Ltda.',
      cidade: 'Curitiba',
      estadoUf: 'PR',
      cnpj: '00.000.000/0001-00',
      status: TenantStatus.ATIVO,
      planoNome: 'Operação SaaS Master',
      emailFaturamento: 'financeiro@escrita.online',
      telefoneContato: '(41) 3000-0000',
    },
    create: {
      id: 'tenant-master',
      codigoIbge: '0000000',
      nomePrefeitura: 'Escrita.Online Sistemas e Soluções Tecnológicas Ltda.',
      cidade: 'Curitiba',
      estadoUf: 'PR',
      cnpj: '00.000.000/0001-00',
      status: TenantStatus.ATIVO,
      planoNome: 'Operação SaaS Master',
      valorMensalBase: 0,
      userLimit: 99,
      valorPorUsuarioExtra: 0,
      diaVencimento: 1,
      emailFaturamento: 'financeiro@escrita.online',
      telefoneContato: '(41) 3000-0000',
      isDemonstracao: false,
    },
  });

  // Usuários Master Admin
  await prisma.user.upsert({
    where: { email: 'admin@empresa.gov.br' },
    update: {
      senhaHash: SENHA_HASH_PADRAO,
      tenantId: masterTenant.id,
      role: UserRole.MASTER_ADMIN,
      ativo: true,
    },
    create: {
      id: 'user-master-1',
      tenantId: masterTenant.id,
      nomeCompleto: 'Administrador SaaS Master',
      email: 'admin@empresa.gov.br',
      cpf: '000.000.000-00',
      senhaHash: SENHA_HASH_PADRAO,
      role: UserRole.MASTER_ADMIN,
      cargo: 'Superadministrador da Plataforma',
      ativo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@escrita.online' },
    update: {
      senhaHash: SENHA_HASH_PADRAO,
      tenantId: masterTenant.id,
      role: UserRole.MASTER_ADMIN,
      ativo: true,
    },
    create: {
      id: 'user-master-2',
      tenantId: masterTenant.id,
      nomeCompleto: 'Gestor Operacional Escrita.Online',
      email: 'admin@escrita.online',
      cpf: '000.000.000-01',
      senhaHash: SENHA_HASH_PADRAO,
      role: UserRole.MASTER_ADMIN,
      cargo: 'Gestor de Contratos SaaS',
      ativo: true,
    },
  });

  // 2. TENANTS MUNICIPAIS DE DEMONSTRAÇÃO
  const demoTenants = [
    {
      id: 'tenant-araucaria',
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
      users: [
        {
          id: 'user-ara-1',
          email: 'gabinete.prefeito@araucaria.pr.gov.br',
          cpf: '381.992.109-04',
          nomeCompleto: 'Dr. Hissam Hussein Dehaini',
          cargo: 'Prefeito Municipal',
          role: UserRole.PREFEITO,
          secretaria: null,
          isExtra: false,
        },
        {
          id: 'user-ara-2',
          email: 'secretario.financas@araucaria.pr.gov.br',
          cpf: '512.883.402-91',
          nomeCompleto: 'Geraldo Antonio Gubert',
          cargo: 'Secretário Municipal de Finanças',
          role: UserRole.SECRETARIO_FINANCAS,
          secretaria: 'SEMFAZ',
          isExtra: false,
        },
        {
          id: 'user-ara-3',
          email: 'obras.projetos@araucaria.pr.gov.br',
          cpf: '842.119.504-20',
          nomeCompleto: 'Eng. Fernando R. Santos',
          cargo: 'Secretário Municipal de Obras Públicas',
          role: UserRole.SECRETARIA_SETORIAL,
          secretaria: 'SMOP',
          isExtra: true,
        },
      ],
    },
    {
      id: 'tenant-curitiba',
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
      users: [
        {
          id: 'user-cur-1',
          email: 'prefeito@curitiba.pr.gov.br',
          cpf: '409.551.890-55',
          nomeCompleto: 'Eduardo Pimentel Slaviero',
          cargo: 'Prefeito Municipal',
          role: UserRole.PREFEITO,
          secretaria: null,
          isExtra: false,
        },
        {
          id: 'user-cur-2',
          email: 'financas@curitiba.pr.gov.br',
          cpf: '298.114.773-80',
          nomeCompleto: 'Cristiano Hotz',
          cargo: 'Secretário Municipal de Finanças',
          role: UserRole.SECRETARIO_FINANCAS,
          secretaria: 'SEFIN',
          isExtra: false,
        },
      ],
    },
    {
      id: 'tenant-londrina',
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
      users: [
        {
          id: 'user-lon-1',
          email: 'fazenda.secretario@londrina.pr.gov.br',
          cpf: '612.449.120-33',
          nomeCompleto: 'João Carlos Perez',
          cargo: 'Secretário Municipal de Fazenda',
          role: UserRole.SECRETARIO_FINANCAS,
          secretaria: 'SMF',
          isExtra: false,
        },
        {
          id: 'user-lon-2',
          email: 'gestao.orcamento@londrina.pr.gov.br',
          cpf: '184.229.401-12',
          nomeCompleto: 'Fábio Cavazotti',
          cargo: 'Diretor de Planejamento Orçamentário',
          role: UserRole.CONTROLADORIA,
          secretaria: 'SMG',
          isExtra: false,
        },
      ],
    },
    {
      id: 'tenant-maringa',
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
      users: [
        {
          id: 'user-mar-1',
          email: 'planejamento@maringa.pr.gov.br',
          cpf: '733.221.801-09',
          nomeCompleto: 'Silvio Barros II',
          cargo: 'Prefeito Municipal',
          role: UserRole.PREFEITO,
          secretaria: null,
          isExtra: false,
        },
        {
          id: 'user-mar-2',
          email: 'fazenda@maringa.pr.gov.br',
          cpf: '921.330.129-44',
          nomeCompleto: 'Orlando Chiqueto',
          cargo: 'Secretário de Fazenda',
          role: UserRole.SECRETARIO_FINANCAS,
          secretaria: 'SEFAZ',
          isExtra: false,
        },
      ],
    },
  ];

  for (const { users, ...tenantData } of demoTenants) {
    console.log(`[Seed] Inserindo prefeitura: ${tenantData.nomePrefeitura} (${tenantData.codigoIbge})...`);
    const tenant = await prisma.tenant.upsert({
      where: { codigoIbge: tenantData.codigoIbge },
      update: tenantData,
      create: tenantData,
    });

    // Inserção/Atualização dos usuários do município
    for (const userData of users) {
      console.log(`  -> Usuário: ${userData.nomeCompleto} (${userData.email})`);
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          nomeCompleto: userData.nomeCompleto,
          cpf: userData.cpf,
          cargo: userData.cargo,
          role: userData.role,
          secretaria: userData.secretaria,
          senhaHash: SENHA_HASH_PADRAO,
          tenantId: tenant.id,
          ativo: true,
          isExtra: userData.isExtra,
        },
        create: {
          id: userData.id,
          tenantId: tenant.id,
          nomeCompleto: userData.nomeCompleto,
          email: userData.email,
          cpf: userData.cpf,
          senhaHash: SENHA_HASH_PADRAO,
          role: userData.role,
          cargo: userData.cargo,
          secretaria: userData.secretaria,
          ativo: true,
          isExtra: userData.isExtra,
        },
      });
    }

    // Provisiona APIs padrão se não existirem
    const existingApis = await prisma.tenantApiConfig.count({ where: { tenantId: tenant.id } });
    if (existingApis === 0) {
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
    }
  }

  console.log('✓ [Prisma Seed] Base de dados populada com sucesso com todos os tenants e usuários!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
