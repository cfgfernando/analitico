import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'SaaS Fiscal Multi-Tenant NestJS Engine',
      version: '4.0.0',
      database: 'MySQL 8 (Prisma Ready)',
      redis: 'BullMQ Queue Ready',
    };
  }
}
