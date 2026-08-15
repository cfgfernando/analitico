import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import env from '../config/env';

/**
 * Helmet Security Headers configurados para compatibilidade com Vite,
 * CDNs institucionais do Gov.br (Serpro) e Google Fonts.
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdngovbr-ds.estaleiro.serpro.gov.br',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdngovbr-ds.estaleiro.serpro.gov.br',
        'data:',
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        'https://apidatalake.tesouro.gov.br',
        'https://generativelanguage.googleapis.com',
        'https:',
        'ws:',
        'wss:',
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * Middleware de CORS com restrição baseada em origens permitidas
 */
export const corsSecurityMiddleware = cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps, curl, server-to-server) em desenvolvimento
    if (!origin) return callback(null, true);

    const isAllowed = env.CORS_ORIGIN.some(allowed => {
      if (allowed === '*') return true;
      return origin.toLowerCase() === allowed.toLowerCase() || origin.startsWith('http://localhost:');
    });

    if (isAllowed || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`[Segurança CORS] Origem '${origin}' não autorizada.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'x-requested-with'],
});

/**
 * Rate limiter para rotas de autenticação (mitigação de brute force)
 * Máximo de 15 tentativas a cada 15 minutos por IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de autenticação detectadas. Por favor, tente novamente em 15 minutos.',
  },
});

/**
 * Rate limiter geral para APIs (proteção contra DoS simples)
 * Máximo de 300 requisições por minuto por IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Limite de requisições excedido. Aguarde alguns instantes.',
  },
});
