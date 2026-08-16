import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_PERMISSIONS } from './interfaces/jwt-payload.interface';

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
  const jwtService = moduleRef.get<JwtService>(JwtService);

  // =========================================================================
  // 1. LOGIN COM CREDENCIAIS VÁLIDAS
  // =========================================================================
  const loginRes = await authService.login({
    email: 'gabinete.prefeito@araucaria.pr.gov.br',
    senha: 'senha123',
  });

  assert(!!loginRes.accessToken && !!loginRes.refreshToken, 'Login com credenciais válidas gera accessToken e refreshToken');
  assert(loginRes.user.role === 'PREFEITO', 'Payload do usuário autenticado contém role PREFEITO');
  assert(loginRes.user.tenantId === 'tenant-araucaria', 'Payload contém tenantId correto (tenant-araucaria)');
  assert(!!loginRes.user.sessionId, 'Login gera sessionId único para rastreabilidade');
  assert(Array.isArray(loginRes.user.permissions) && loginRes.user.permissions.length > 0, 'Usuário autenticado recebe lista de permissões granulares');

  // =========================================================================
  // 2. VALIDAÇÃO DO CONTEÚDO DO JWT
  // =========================================================================
  const decoded: any = jwtService.verify(loginRes.accessToken);
  assert(decoded.userId === loginRes.user.id, 'Token JWT contém claim userId correto');
  assert(decoded.role === 'PREFEITO', 'Token JWT contém claim role correto');
  assert(decoded.tenantId === 'tenant-araucaria', 'Token JWT contém claim tenantId correto');
  assert(Array.isArray(decoded.permissions), 'Token JWT contém array de permissões granulares');
  assert(decoded.sessionId === loginRes.user.sessionId, 'Token JWT contém sessionId correto');

  // =========================================================================
  // 3. PERMISSÕES GRANULARES POR ROLE
  // =========================================================================
  const prefeitoPerms = ROLE_PERMISSIONS['PREFEITO'];
  assert(prefeitoPerms.includes('fiscal:read'), 'PREFEITO tem permissão fiscal:read');
  assert(prefeitoPerms.includes('fiscal:export'), 'PREFEITO tem permissão fiscal:export');
  assert(!prefeitoPerms.includes('fiscal:write'), 'PREFEITO NÃO tem permissão fiscal:write');
  assert(!prefeitoPerms.includes('users:manage'), 'PREFEITO NÃO tem permissão users:manage');

  const secFinancasPerms = ROLE_PERMISSIONS['SECRETARIO_FINANCAS'];
  assert(secFinancasPerms.includes('fiscal:write'), 'SECRETARIO_FINANCAS tem permissão fiscal:write');
  assert(secFinancasPerms.includes('siconfi:sync'), 'SECRETARIO_FINANCAS tem permissão siconfi:sync');

  const masterPerms = ROLE_PERMISSIONS['MASTER_ADMIN'];
  assert(masterPerms.includes('tenants:manage'), 'MASTER_ADMIN tem permissão tenants:manage');
  assert(masterPerms.includes('billing:write'), 'MASTER_ADMIN tem permissão billing:write');

  // =========================================================================
  // 4. REFRESH TOKEN — ROTAÇÃO AUTOMÁTICA
  // =========================================================================
  const refreshRes = await authService.refreshToken(loginRes.refreshToken);
  assert(!!refreshRes.accessToken && refreshRes.success === true, 'Rotação e renovação de accessToken via refreshToken com sucesso');
  assert(refreshRes.refreshToken !== loginRes.refreshToken, 'Refresh Token rotacionado (novo token diferente do anterior)');

  // =========================================================================
  // 5. LOGIN COM SENHA INVÁLIDA → 401
  // =========================================================================
  let invalidPassCaught = false;
  try {
    await authService.login({
      email: 'gabinete.prefeito@araucaria.pr.gov.br',
      senha: 'senha_incorreta_total_123',
    });
  } catch (err: any) {
    invalidPassCaught = true;
    assert(err instanceof UnauthorizedException, 'Senha incorreta retorna 401 UnauthorizedException');
  }
  assert(invalidPassCaught, 'Tentativa de login com senha incorreta é bloqueada corretamente');

  // =========================================================================
  // 6. LOGIN COM USUÁRIO INEXISTENTE → 401
  // =========================================================================
  let unknownUserCaught = false;
  try {
    await authService.login({
      email: 'usuario.inexistente@municipio.gov.br',
      senha: 'qualquer_senha',
    });
  } catch (err: any) {
    unknownUserCaught = true;
    assert(err instanceof UnauthorizedException, 'Usuário inexistente retorna 401 UnauthorizedException');
  }
  assert(unknownUserCaught, 'Login com e-mail não cadastrado é rejeitado');

  // =========================================================================
  // 7. LOGOUT — REVOGAÇÃO DE SESSÃO
  // =========================================================================
  const loginForLogout = await authService.login({
    email: 'gabinete.prefeito@araucaria.pr.gov.br',
    senha: 'senha123',
  });
  const logoutRes = await authService.logout(loginForLogout.refreshToken, loginForLogout.user.id);
  assert(logoutRes.success === true, 'Logout encerra sessão e retorna sucesso');

  // =========================================================================
  // 8. LISTAGEM DE SESSÕES ATIVAS
  // =========================================================================
  const sessionsRes = await authService.listActiveSessions('user-ara-1');
  assert(typeof sessionsRes.success === 'boolean', 'listActiveSessions retorna objeto de sucesso');
  assert(Array.isArray(sessionsRes.sessions), 'listActiveSessions retorna array de sessões');

  // =========================================================================
  // 9. ISOLAMENTO DE TENANT — TenantGuard
  // =========================================================================
  const tenantGuard = new TenantGuard();

  // CASO A: Usuário acessando dados do próprio município → PERMITIDO
  const validContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'SECRETARIO_FINANCAS', permissions: [] },
        params: { tenantId: 'tenant-araucaria' },
        query: {},
        body: {},
        headers: {},
      }),
    }),
  };
  assert(tenantGuard.canActivate(validContext) === true, 'Usuário acessando próprio município é autorizado pelo TenantGuard');

  // CASO B: Cross-tenant (Araucária tentando acessar Curitiba) → 403
  let crossAccessBlocked = false;
  const invalidCrossContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'SECRETARIO_FINANCAS', permissions: [] },
        params: { tenantId: 'tenant-curitiba' },
        query: {},
        body: {},
        headers: {},
      }),
    }),
  };
  try {
    tenantGuard.canActivate(invalidCrossContext);
  } catch (err: any) {
    crossAccessBlocked = true;
    assert(err instanceof ForbiddenException, 'Acesso cruzado entre municípios gera ForbiddenException (403)');
  }
  assert(crossAccessBlocked, 'Isolamento de tenant: Tenant A não acessa dados de Tenant B');

  // CASO C: MASTER_ADMIN acessa qualquer tenant → PERMITIDO
  const masterCrossContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'admin-1', tenantId: 'tenant-master', role: 'MASTER_ADMIN', permissions: [] },
        params: { tenantId: 'tenant-curitiba' },
        query: {},
        body: {},
        headers: {},
      }),
    }),
  };
  assert(tenantGuard.canActivate(masterCrossContext) === true, 'MASTER_ADMIN tem acesso cross-tenant autorizado');

  // CASO D: Isolamento via header x-tenant-id
  let headerIsolationBlocked = false;
  const headerCrossContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'PREFEITO', permissions: [] },
        params: {},
        query: {},
        body: {},
        headers: { 'x-tenant-id': 'tenant-curitiba' },
      }),
    }),
  };
  try {
    tenantGuard.canActivate(headerCrossContext);
  } catch (err: any) {
    headerIsolationBlocked = true;
    assert(err instanceof ForbiddenException, 'Cross-tenant via header x-tenant-id também é bloqueado (403)');
  }
  assert(headerIsolationBlocked, 'Isolamento de tenant via header x-tenant-id funciona corretamente');

  // =========================================================================
  // 10. RBAC — RolesGuard
  // =========================================================================
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  // Mock: handler protegido para MASTER_ADMIN
  reflector.getAllAndOverride = ((key: string) => {
    if (key === 'roles') return ['MASTER_ADMIN'];
    return undefined;
  }) as any;

  // PREFEITO tenta acessar rota de MASTER_ADMIN → 403
  let rbacBlocked = false;
  const prefeitoContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'PREFEITO', permissions: prefeitoPerms },
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  };
  try {
    rolesGuard.canActivate(prefeitoContext);
  } catch (err: any) {
    rbacBlocked = true;
    assert(err instanceof ForbiddenException, 'Role PREFEITO tentando acessar rota de MASTER_ADMIN recebe 403 ForbiddenException');
  }
  assert(rbacBlocked, 'RBAC bloqueia acesso de roles não autorizados');

  // MASTER_ADMIN acessa qualquer rota → PERMITIDO
  const masterContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'admin-1', tenantId: 'tenant-master', role: 'MASTER_ADMIN', permissions: masterPerms },
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  };
  assert(rolesGuard.canActivate(masterContext) === true, 'MASTER_ADMIN tem acesso administrativo global autorizado pelo RolesGuard');

  // Rota sem restrição → qualquer autenticado
  reflector.getAllAndOverride = (() => undefined) as any;
  const openRouteContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', tenantId: 'tenant-araucaria', role: 'VISUALIZADOR_GERAL', permissions: [] },
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  };
  assert(rolesGuard.canActivate(openRouteContext) === true, 'Rota sem @Roles declarado é acessível por qualquer usuário autenticado');

  // =========================================================================
  // FIM DOS TESTES
  // =========================================================================
  console.log(`\nResultado da Fase 3: ${passCount}/${totalCount} testes de autenticação, RBAC e isolamento passaram com sucesso.`);
}

runAuthTests().catch((err) => {
  console.error('Erro fatal no teste de Auth (Fase 3):', err.message || err);
  process.exit(1);
});
