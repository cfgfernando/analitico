import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import env from '../../config/env';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
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
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, TenantGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard, TenantGuard],
})
export class AuthModule {}
