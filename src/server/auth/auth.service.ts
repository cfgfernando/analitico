import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(credentials: any) {
    return {
      success: true,
      accessToken: 'dummy_jwt_access_token_fase1',
      refreshToken: 'dummy_jwt_refresh_token_fase1',
      user: {
        id: 'user-ara-1',
        nome: 'Dr. Hissam Hussein Dehaini',
        email: credentials.email || 'gabinete.prefeito@araucaria.pr.gov.br',
        role: 'PREFEITO',
      },
    };
  }

  async refreshToken(token: string) {
    return {
      success: true,
      accessToken: 'dummy_jwt_renewed_access_token_fase1',
    };
  }
}
