import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole, Permission, AuthenticatedUser, ROLE_PERMISSIONS } from '../interfaces/jwt-payload.interface';

/**
 * RolesGuard — Controle de Acesso Baseado em Papel (RBAC) + Permissões Granulares
 *
 * Hierarquia de verificação:
 * 1. MASTER_ADMIN tem acesso irrestrito a todos os recursos
 * 2. Verifica @Roles(...) — quais papéis podem acessar
 * 3. Verifica @RequirePermissions(...) — permissões granulares (opcional)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem restrição declarada = rota aberta para qualquer autenticado
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest() as { user?: AuthenticatedUser };
    if (!user) {
      throw new ForbiddenException('Acesso negado: Perfil de usuário não identificado.');
    }

    // MASTER_ADMIN tem bypass total
    if (user.role === 'MASTER_ADMIN') {
      return true;
    }

    // Verifica roles
    if (requiredRoles?.length) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Acesso negado: O perfil '${user.role}' não possui permissão para acessar este recurso. Perfis necessários: ${requiredRoles.join(', ')}.`,
        );
      }
    }

    // Verifica permissões granulares
    if (requiredPermissions?.length) {
      const userPermissions = user.permissions ?? ROLE_PERMISSIONS[user.role] ?? [];
      const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p));
      if (missingPermissions.length > 0) {
        throw new ForbiddenException(
          `Acesso negado: Permissões insuficientes. Faltam: ${missingPermissions.join(', ')}.`,
        );
      }
    }

    return true;
  }
}
