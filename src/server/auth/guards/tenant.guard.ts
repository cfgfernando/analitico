import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * TenantGuard — Isolamento Estrito de Dados por Município (Tenant)
 *
 * Garante que um usuário só acesse dados do próprio município.
 * O tenantId é extraído do JWT (fonte confiável) e comparado com:
 * - request.params.tenantId
 * - request.query.tenantId
 * - request.body.tenantId
 * - Header: x-tenant-id
 *
 * MASTER_ADMIN tem acesso cross-tenant irrestrito.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      // Sem usuário = JwtAuthGuard vai lidar com 401
      return true;
    }

    // Coleta tenantId da requisição de todas as fontes possíveis
    const requestedTenant: string | undefined =
      (request.query?.tenantId as string) ||
      (request.query?.codigoIbge as string) ||
      request.params?.tenantId ||
      request.body?.tenantId ||
      (request.headers ? (request.headers['x-tenant-id'] as string) : undefined);

    // MASTER_ADMIN tem acesso irrestrito entre qualquer tenant
    if (user.role === 'MASTER_ADMIN') {
      request.tenantId = requestedTenant || user.tenantId;
      return true;
    }

    // Enforce: se foi solicitado um tenant diferente do que está no token -> 403
    if (requestedTenant && requestedTenant !== user.tenantId) {
      throw new ForbiddenException(
        `[Isolamento de Tenant] Acesso cruzado não autorizado. ` +
        `Seu usuário pertence ao município '${user.tenantId}', mas tentou acessar dados de '${requestedTenant}'. ` +
        `Cada prefeitura só acessa seus próprios dados.`,
      );
    }

    // Força o tenantId da requisição a ser o do token JWT (imutável)
    request.tenantId = user.tenantId;

    return true;
  }
}
