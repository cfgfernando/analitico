import { Reflector } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import env from '../../config/env';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { AuditInterceptor } from './interceptors/tenant.interceptor';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.JWT_SECRET || 'saas_fiscal_default_jwt_secret_change_in_production_min_32_chars',
      signOptions: { expiresIn: (env.JWT_EXPIRES_IN || '15m') as any },
    }),
    DatabaseModule,
    RepositoriesModule,
  ],
  controllers: [AuthController],
  providers: [
    Reflector,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    AuditInterceptor,
    // Guards globais aplicados via APP_GUARD (ordem importa)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Interceptor global para auditoria
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    AuditInterceptor,
  ],
})
export class AuthModule {}
