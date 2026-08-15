import dotenv from 'dotenv';
dotenv.config();

export interface AppEnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  APP_URL: string;
  CORS_ORIGIN: string[];
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string;
  GEMINI_API_KEY?: string;
  REDIS_URL: string;
}

function getEnvVariable(name: string, fallback?: string, required: boolean = false): string {
  const value = process.env[name] || fallback;
  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `[Configuração Crítica] Variável de ambiente obrigatória '${name}' não está definida. Verifique seu arquivo .env.`
    );
  }
  return value || '';
}

export const env: AppEnvConfig = {
  PORT: parseInt(getEnvVariable('PORT', '3000'), 10),
  NODE_ENV: (getEnvVariable('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  APP_URL: getEnvVariable('APP_URL', 'http://localhost:3000'),
  CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(origin => origin.trim()),
  DATABASE_URL: getEnvVariable('DATABASE_URL', 'mysql://root:password@localhost:3306/saas_fiscal_prefeituras'),
  JWT_SECRET: getEnvVariable(
    'JWT_SECRET',
    'saas_fiscal_default_jwt_secret_change_in_production_min_32_chars'
  ),
  JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: getEnvVariable(
    'JWT_REFRESH_SECRET',
    'saas_fiscal_default_jwt_refresh_secret_change_in_production_32_chars'
  ),
  JWT_REFRESH_EXPIRES_IN: getEnvVariable('JWT_REFRESH_EXPIRES_IN', '7d'),
  ENCRYPTION_KEY: getEnvVariable(
    'ENCRYPTION_KEY',
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  ),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
  REDIS_URL: getEnvVariable('REDIS_URL', 'redis://localhost:6379'),
};

export default env;
