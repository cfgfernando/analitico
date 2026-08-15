import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import env from '../../../config/env';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null;
          if (req && req.headers && req.headers['authorization']) {
            const parts = req.headers['authorization'].split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
              token = parts[1];
            }
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET || 'saas_fiscal_default_jwt_secret_change_in_production_min_32_chars',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.userId || !payload.tenantId) {
      throw new UnauthorizedException('Token de autenticação com formato inválido.');
    }

    return {
      id: payload.userId,
      email: payload.email,
      nomeCompleto: payload.nomeCompleto,
      tenantId: payload.tenantId,
      role: payload.role,
      secretaria: payload.secretaria,
    };
  }
}
