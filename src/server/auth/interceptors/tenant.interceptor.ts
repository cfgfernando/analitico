import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * AuditInterceptor — Rastreabilidade de Ações por Tenant
 *
 * Registra no log estruturado todas as requisições autenticadas,
 * com: método, rota, tenantId, userId, role e duração.
 *
 * Não persiste no banco (isso é responsabilidade do AuthService._auditLog).
 * Aqui é logging estruturado para monitoramento e observabilidade.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    const start = Date.now();

    const method = request.method;
    const url = request.url;
    const tenantId = request.tenantId || user?.tenantId || 'anonymous';
    const userId = user?.id || 'anonymous';
    const role = user?.role || 'NONE';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `[${method}] ${url} | tenant=${tenantId} | user=${userId} | role=${role} | ${ms}ms`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.warn(
            `[${method}] ${url} | tenant=${tenantId} | user=${userId} | role=${role} | ERROR=${err.status || 500} | ${ms}ms`,
          );
        },
      }),
    );
  }
}
