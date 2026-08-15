import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AppModule } from './app.module';
import env from '../config/env';
import {
  helmetSecurityMiddleware,
  corsSecurityMiddleware,
  apiRateLimiter,
} from './security';

async function bootstrap() {
  const logger = new Logger('NestBootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();

  // Middlewares de Segurança (Fase 0)
  expressApp.use(helmetSecurityMiddleware);
  expressApp.use(corsSecurityMiddleware);
  expressApp.use('/api/', apiRateLimiter);

  // Validação Global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Vite Dev Server / Static SPA Handler
  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
    logger.log('Vite SPA middleware acoplado ao NestJS em modo desenvolvimento.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`[SGF NestJS Engine] Servidor ativo e pronto em http://localhost:${port}`);
}

bootstrap();
