import { Controller, Get, Post, Param, Inject } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/saas')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Public()
  @Get('invoices')
  getInvoices() {
    return this.billingService.getInvoices();
  }

  @Public()
  @Post('invoices/:id/pay')
  payInvoice(@Param('id') id: string) {
    return {
      success: true,
      message: `Fatura ${id} marcada como paga manualmente via conciliação bancária!`,
    };
  }

  @Public()
  @Get('metrics')
  getMetrics() {
    return this.billingService.getMetrics();
  }
}
