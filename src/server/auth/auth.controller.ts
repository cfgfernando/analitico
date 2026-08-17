import { Controller, Post, Get, Body, Param, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import {
  LookupIdentifierDto,
  LoginTenantDto,
  LoginDto,
  LoginAdminDto,
  RegisterDto,
  RefreshTokenDto,
  LogoutDto,
} from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Cadastra novo usuário em um tenant (requer MASTER_ADMIN ou PREFEITO).
   */
  @Post('register')
  @Roles('MASTER_ADMIN', 'PREFEITO')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  /**
   * POST /api/auth/login
   * Autentica usuário e retorna accessToken + refreshToken.
   * Rota pública (não requer token).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body || {});
  }

  /**
   * POST /api/auth/lookup-identifier
   * Detecta automaticamente a prefeitura (tenant) de um usuário por E-mail ou CPF.
   * Rota pública.
   */
  @Public()
  @Post('lookup-identifier')
  @HttpCode(HttpStatus.OK)
  async lookupIdentifier(@Body() body: any) {
    try {
      const identifier =
        typeof body === 'string'
          ? body
          : body?.identifier || body?.email || body?.cpf || '';
      return await this.authService.lookupByIdentifier(identifier);
    } catch (err: any) {
      console.error('[lookupIdentifier Controller Error]:', err);
      return { success: false, error: err.message, stack: err.stack };
    }
  }

  /**
   * POST /api/auth/login-tenant
   * Login do portal municipal via E-mail ou CPF, retornando o tenant (prefeitura)
   * para redirecionamento direto. Rota pública.
   */
  @Public()
  @Post('login-tenant')
  @HttpCode(HttpStatus.OK)
  async loginTenant(@Body() body: any) {
    try {
      return await this.authService.loginTenant(body || {});
    } catch (err: any) {
      console.error('[loginTenant Controller Error]:', err);
      return { success: false, error: err.message, stack: err.stack };
    }
  }

  /**
   * POST /api/auth/login-admin
   * Login exclusivo para Administrador Master SaaS da plataforma.
   * Rota pública.
   */
  @Public()
  @Post('login-admin')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(@Body() body: any) {
    return this.authService.loginAdmin(body || {});
  }

  /**
   * POST /api/auth/refresh
   * Rotaciona o refreshToken e emite novo accessToken.
   * Rota pública (token expirado ainda pode chamar isso).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    return this.authService.refreshToken(body?.refreshToken || '');
  }

  /**
   * POST /api/auth/logout
   * Revoga o refreshToken e encerra sessão.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: LogoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.logout(body?.refreshToken || '', user?.id);
  }

  /**
   * GET /api/auth/me
   * Retorna o perfil completo do usuário autenticado (via JWT).
   */
  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, user };
  }

  /**
   * GET /api/auth/sessions
   * Lista todas as sessões ativas (refresh tokens válidos) do usuário atual.
   */
  @Get('sessions')
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listActiveSessions(user.id);
  }

  /**
   * GET /api/auth/permissions
   * Retorna as permissões granulares do usuário autenticado.
   */
  @Get('permissions')
  getPermissions(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      userId: user.id,
      role: user.role,
      permissions: user.permissions,
    };
  }
}
