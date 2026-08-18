import { execSync } from 'child_process';

try {
  console.log('--- Staging ---');
  execSync('git add -A', { stdio: 'inherit' });
  console.log('--- Committing ---');
  execSync('git commit -m "feat(refactor): migracao para dados 100% reais de APIs oficiais e carga governamental"', { stdio: 'inherit' });
  console.log('--- Push ---');
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ SUCESSO: Commit e Push concluídos no GitHub!');
} catch (err: any) {
  console.error('Erro na execução git:', err.message);
}
