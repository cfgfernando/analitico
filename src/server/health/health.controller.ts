import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
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
