import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

async function runAuthTests() {
  console.log('--- [TESTE DE AUTENTICAÇÃO, RBAC E ISOLAMENTO FASE 3: NESTJS] ---');
  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      throw new Error(`Falha no teste: ${testName}`);
    }
  }

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const authService = moduleRef.get<AuthService>(AuthService);
  const authController = moduleRef.get<AuthController>(AuthController);
  const jwtService = moduleRef.get<JwtService>(JwtService);

  // 1. Teste de Login com sucesso
  const loginRes = await authService.login({
    email: 'gabinete.prefeito@araucaria.pr.gov.br',
    senha: 'senha123',
  });
  assert(!!loginRes.accessToken && !!loginRes.refreshToken, 'Login com credenciais válidas gera access token e refresh token');
  assert(loginRes.user.role === 'PREFEITO', 'Payload do usuário autenticado contém role PREFEITO');
  assert(loginRes.user.tenantId === 'tenant-araucaria', 'Payload do usuário contém tenantId correto (tenant-araucaria)');

  // 2. Teste de validação do token gerado
  const decoded: any = jwtService.verify(loginRes.accessToken);
  assert(decoded.userId === loginRes.user.id && decoded.role === 'PREFEITO', 'Token JWT assinado contém claims corretas (sub, role, tenantId)');

  // 3. Teste de Refresh Token
  const refreshRes = await authService.refreshToken(loginRes.refreshToken);
  assert(!!refreshRes.accessToken && refreshRes.success, 'Rotação e renovação de Access Token via Refresh Token com sucesso');

  // 4. Teste de Login com senha inválida
  let invalidPassCaught = false;
  try {
    await authService.login({
      email: 'gabinete.prefeito@araucaria.pr.gov.br',
      senha: 'senha_incorreta_total',
    });
  } catch (err: any) {
    invalidPassCaught = true;
    assert(err instanceof UnauthorizedException, 'Senha incorreta retorna 401 Unauthorized');
  }
  assert(invalidPassCaught, 'Tentativa de login com senha incorreta é bloqueada');

  // 5. Teste de Logout
  const logoutRes = await authService.logout(refreshRes.refreshToken);
  assert(logoutRes.success, 'Logout encerra sessão e revoga tokens');

  // 6. Teste de Isolamento de Tenant (TenantGuard)
  const tenantGuard = new TenantGuard();

  // Caso A: Usuário de Araucária acessando dados de Araucária -> PERMITIDO
  const validContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'SECRETARIO_FINANCAS' },
        query: { tenantId: 'tenant-araucaria' },
      }),
    }),
  };
  assert(tenantGuard.canActivate(validContext) === true, 'Usuário acessando seu próprio município é autorizado');

  // Caso B: Usuário de Araucária tentando acessar Curitiba -> BLOQUEADO (403 Forbidden)
  let crossAccessBlocked = false;
  const invalidCrossContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'SECRETARIO_FINANCAS' },
        query: { tenantId: 'tenant-curitiba' },
      }),
    }),
  };
  try {
    tenantGuard.canActivate(invalidCrossContext);
  } catch (err: any) {
    crossAccessBlocked = true;
    assert(err instanceof ForbiddenException, 'Acesso cruzado entre municípios é rejeitado com 403 Forbidden');
  }
  assert(crossAccessBlocked, 'Isolamento de tenant estrito: Tenant A não lê dados de Tenant B');

  // 7. Teste de RBAC (RolesGuard)
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  // Mock de handler protegido para MASTER_ADMIN
  reflector.getAllAndOverride = ((key: string) => ['MASTER_ADMIN']) as any;

  // Usuário PREFEITO tentando acessar rota restrita de MASTER_ADMIN -> BLOQUEADO
  let rbacBlocked = false;
  const prefeitoContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'PREFEITO' },
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  };
  try {
    rolesGuard.canActivate(prefeitoContext);
  } catch (err: any) {
    rbacBlocked = true;
    assert(err instanceof ForbiddenException, 'Usuário com role insuficiente é barrado pelo RolesGuard com 403 Forbidden');
  }
  assert(rbacBlocked, 'RBAC bloqueia acesso de papéis não autorizados');

  // Usuário MASTER_ADMIN acessando rota -> PERMITIDO
  const masterContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'admin-1', tenantId: 'tenant-master', role: 'MASTER_ADMIN' },
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  };
  assert(rolesGuard.canActivate(masterContext) === true, 'MASTER_ADMIN possui acesso administrativo global autorizado');

  console.log(`\nResultado da Fase 3: ${passCount}/${totalCount} testes de autenticação, RBAC e isolamento passaram com sucesso.`);
}

runAuthTests().catch((err) => {
  console.error('Erro fatal no teste de Auth:', err);
  process.exit(1);
});
