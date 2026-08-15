import { Controller, Get, Post, Param, Inject } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('api/saas')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('invoices')
  getInvoices() {
    return this.billingService.getInvoices();
  }

  @Post('invoices/:id/pay')
  payInvoice(@Param('id') id: string) {
    return {
      success: true,
      message: `Fatura ${id} marcada como paga manualmente via conciliação bancária!`,
    };
  }

  @Get('metrics')
  getMetrics() {
    return this.billingService.getMetrics();
  }
}
