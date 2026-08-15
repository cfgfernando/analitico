import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return true; // Se não houver contexto de usuário, o JwtAuthGuard lidará com 401
    }

    // MASTER_ADMIN pode navegar entre qualquer tenant
    if (user.role === 'MASTER_ADMIN') {
      return true;
    }

    const requestedTenant =
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.body?.tenantId ||
      request.headers['x-tenant-id'];

    if (requestedTenant && requestedTenant !== user.tenantId) {
      throw new ForbiddenException(
        `[Isolamento de Tenant] Acesso cruzado não autorizado. Seu usuário pertence ao município '${user.tenantId}', mas tentou acessar dados de '${requestedTenant}'.`
      );
    }

    // Força o tenantId da requisição a ser o do token JWT
    request.tenantId = user.tenantId;

    return true;
  }
}
