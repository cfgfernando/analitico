import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';
import { UserRole } from '../interfaces/jwt-payload.interface';

export class LookupIdentifierDto {
  @IsNotEmpty({ message: 'Identificador (E-mail ou CPF) é obrigatório.' })
  @IsString()
  identifier!: string;
}

export class LoginTenantDto {
  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class LoginDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class LoginAdminDto {
  @IsNotEmpty({ message: 'E-mail de administrador é obrigatório.' })
  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha!: string;

  @IsNotEmpty({ message: 'Nome completo é obrigatório.' })
  @IsString()
  nomeCompleto!: string;

  @IsNotEmpty({ message: 'TenantId é obrigatório.' })
  @IsString()
  tenantId!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  role?: UserRole;

  @IsOptional()
  @IsString()
  secretaria?: string;
}

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token é obrigatório.' })
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
