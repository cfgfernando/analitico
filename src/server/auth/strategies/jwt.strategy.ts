import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import env from '../../../config/env';
import {
  JwtPayload,
  AuthenticatedUser,
  ROLE_PERMISSIONS,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Extrai de cookie httpOnly (para futura implementação de cookie-based auth)
        (req: any) => req?.cookies?.['access_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET || 'saas_fiscal_default_jwt_secret_change_in_production_min_32_chars',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.userId || !payload.tenantId) {
      throw new UnauthorizedException('Token de autenticação com formato inválido.');
    }

    // Sempre recalcula permissões a partir do role no token
    // (garante permissões atualizadas mesmo para tokens emitidos antes de uma mudança de role)
    const permissions = payload.permissions ?? ROLE_PERMISSIONS[payload.role] ?? [];

    return {
      id: payload.userId,
      email: payload.email,
      nomeCompleto: payload.nomeCompleto,
      tenantId: payload.tenantId,
      role: payload.role,
      permissions,
      secretaria: payload.secretaria,
      sessionId: payload.sessionId,
    };
  }
}
