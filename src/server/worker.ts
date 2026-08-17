import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Worker separado para processamento de filas (BullMQ/Cron sync).
 * Roda sem HTTP server — apenas inicializa os módulos de schedule.
 * Memória separada da API para evitar contenção em picos de RAM.
 */
async function bootstrapWorker() {
  const logger = new Logger('SGF-Worker');

  logger.log('[Worker] Iniciando worker de sincronização...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  logger.log('[Worker] Módulos carregados. Processando sincronizações agendadas.');

  process.on('SIGTERM', async () => {
    logger.log('[Worker] SIGTERM recebido. Encerrando graciosamente...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('[Worker] SIGINT recebido. Encerrando...');
    await app.close();
    process.exit(0);
  });
}

bootstrapWorker().catch(err => {
  console.error('[Worker] Falha fatal:', err);
  process.exit(1);
});
