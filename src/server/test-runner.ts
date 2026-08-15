import { execSync } from 'child_process';

async function runAllSuites() {
  console.log('================================================================');
  console.log('🚀 SAAS FISCAL MULTI-TENANT V4.0.0 — PIPELINE UNIFICADO DE TESTES');
  console.log('================================================================\n');

  const suites = [
    { name: 'Fase 0: Criptografia AES-256-GCM e Segurança', file: 'src/utils/crypto.test.ts' },
    { name: 'Fase 1: Arquitetura Modular Monólito NestJS', file: 'src/server/app.module.spec.ts' },
    { name: 'Fase 2: Persistência Real MySQL 8 + Prisma ORM', file: 'src/server/database/prisma.spec.ts' },
    { name: 'Fase 3: Autenticação JWT, RBAC e Multi-Tenancy', file: 'src/server/auth/auth.spec.ts' },
    { name: 'Fase 4: DataSourceBadge e Rastreabilidade de Dados', file: 'src/components/datasource.spec.ts' },
    { name: 'Fase 5: Conexão Real com SICONFI & Ingestão', file: 'src/server/siconfi/siconfi.spec.ts' },
    { name: 'Fase 6: Painel do Prefeito & Top 3 Decisões Urgentes', file: 'src/server/fiscal/painel-prefeito.spec.ts' },
    { name: 'Fase 7: Radar de Captação & Simulador de Contrapartida', file: 'src/server/fiscal/radar-captacao.spec.ts' },
    { name: 'Fase 8: Simulador da Reforma Tributária (EC 132/2023)', file: 'src/server/fiscal/simulador-reforma.spec.ts' },
    { name: 'Fase 9: Benchmark Municipal & Eficiência Fiscal', file: 'src/server/fiscal/benchmark.spec.ts' },
    { name: 'Fase 10: Selo de Conformidade & Certificado Oficial', file: 'src/server/fiscal/selo-conformidade.spec.ts' },
    { name: 'Fase 11: Sistema Proativo de Alertas & Riscos Fiscais', file: 'src/server/fiscal/alertas-proativos.spec.ts' },
  ];

  let totalSuites = suites.length;
  let passedSuites = 0;

  for (const suite of suites) {
    console.log(`\n▶️ Executando ${suite.name} (${suite.file})...`);
    try {
      execSync(`npx tsx ${suite.file}`, { stdio: 'inherit' });
      passedSuites++;
    } catch (err) {
      console.error(`❌ Falha na suíte: ${suite.name}`);
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 TODAS AS ${passedSuites}/${totalSuites} SUÍTES DE TESTES FORAM APROVADAS COM SUCESSO!`);
  console.log('🔒 100% DOS CRITÉRIOS DE QUALIDADE E CONFORMIDADE ATENDIDOS (V4.0.0)');
  console.log('================================================================\n');
}

runAllSuites().catch(err => {
  console.error('Erro crítico no executor de testes:', err);
  process.exit(1);
});
