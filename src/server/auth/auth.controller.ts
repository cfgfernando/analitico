import { Controller, Post, Get, Body, Param, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, RegisterDto } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';

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
  async login(@Body() body: { email: string; senha: string }) {
    return this.authService.login(body);
  }

  /**
   * POST /api/auth/refresh
   * Rotaciona o refreshToken e emite novo accessToken.
   * Rota pública (token expirado ainda pode chamar isso).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * POST /api/auth/logout
   * Revoga o refreshToken e encerra sessão.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.logout(refreshToken, user?.id);
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
