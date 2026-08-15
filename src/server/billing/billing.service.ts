import { Injectable, Inject } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BillingService {
  constructor(
    @Inject(TenantsService) private readonly tenantsService: TenantsService,
    @Inject(UsersService) private readonly usersService: UsersService
  ) {}

  getInvoices() {
    const tenants = this.tenantsService.getRawTenants();
    const allUsers = this.usersService.getAllUsers();

    const invoices = tenants.map(t => {
      const users = allUsers.filter(u => u.tenantId === t.id && u.ativo);
      const totalUsuarios = users.length;
      const usuariosExcedentes = Math.max(0, totalUsuarios - t.userLimit);
      const valorUsuariosExtras = usuariosExcedentes * t.valorUsuarioExtra;
      const valorTotal = t.valorMensalBase + valorUsuariosExtras;

      return {
        id: `inv-2026-08-${t.codigoIbge}`,
        tenantId: t.id,
        prefeituraNome: t.nomePrefeitura,
        mesReferencia: 8,
        anoReferencia: 2026,
        valorBase: t.valorMensalBase,
        totalUsuarios,
        usuariosExcedentes,
        valorUsuariosExtras,
        valorTotal,
        dataVencimento: `2026-08-${String(t.diaVencimento).padStart(2, '0')}`,
        status: t.status === 'ATIVO' ? 'PAGO' : 'PENDENTE',
        linkBoletoPix: `https://faturamento.empresa.gov.br/recibo/${t.codigoIbge}/2026-08`,
      };
    });

    const totalFaturado = invoices.reduce((acc, inv) => acc + inv.valorTotal, 0);
    return { success: true, invoices, totalFaturado };
  }

  getMetrics() {
    const tenants = this.tenantsService.getRawTenants();
    const allUsers = this.usersService.getAllUsers();

    const totalPrefeituras = tenants.length;
    const prefeiturasAtivas = tenants.filter(t => t.status === 'ATIVO').length;
    const mrrBase = tenants.reduce((acc, t) => acc + t.valorMensalBase, 0);

    const totalUsuariosFaturadosExtras = allUsers.filter(u => u.isExtra && u.ativo).length;
    const faturamentoExtras = totalUsuariosFaturadosExtras * 150.0;
    const mrrTotal = mrrBase + faturamentoExtras;

    return {
      success: true,
      metrics: {
        totalPrefeituras,
        prefeiturasAtivas,
        mrrTotal,
        mrrBase,
        arrEstimado: mrrTotal * 12,
        totalUsuariosAtivos: allUsers.filter(u => u.ativo).length,
        totalUsuariosFaturadosExtras,
        faturamentoExtras,
        taxaInadimplencia: 0.0,
        apisOnlinePct: 98.6,
      },
    };
  }
}
