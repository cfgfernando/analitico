import { Injectable, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    let isPublic = false;
    if (this.reflector) {
      if (typeof this.reflector.getAllAndOverride === 'function') {
        isPublic = !!this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
      } else if (typeof this.reflector.get === 'function') {
        isPublic = !!this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
      }
    }

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token de autenticação ausente ou inválido. Realize login para continuar.');
    }
    return user;
  }
}

