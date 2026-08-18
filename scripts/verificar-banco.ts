import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalFinancialRecords = await prisma.financialRecord.count();
  const totalContratos = await prisma.contrato.count();
  const totalSecretarias = await prisma.secretaria.count();
  const totalTenants = await prisma.tenant.count();
  const totalSyncLogs = await prisma.syncLog.count();

  console.log('=== STATUS DOS DADOS REAIS PERSISTIDOS NO MYSQL ===');
  console.log(`- Registros Contábeis (SICONFI/BACEN): ${totalFinancialRecords}`);
  console.log(`- Contratos Administrativos: ${totalContratos}`);
  console.log(`- Secretarias Municipais: ${totalSecretarias}`);
  console.log(`- Prefeituras (Tenants Ativos): ${totalTenants}`);
  console.log(`- Logs Oficiais de Sincronização: ${totalSyncLogs}`);

  const recentRecords = await prisma.financialRecord.findMany({
    take: 6,
    orderBy: { syncedAt: 'desc' },
    select: {
      accountCode: true,
      accountName: true,
      valor: true,
      sourceKey: true,
      exercicioAno: true,
      tenantId: true,
      syncedAt: true,
    },
  });

  console.log('\nExemplos de Registros Recentes Persistidos no Banco:');
  console.table(recentRecords);
}

main()
  .catch((e) => {
    console.error('Erro ao verificar banco de dados:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
