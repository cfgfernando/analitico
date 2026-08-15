import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { UsersRepository } from '../repositories/users.repository';

export interface MockUser {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  role: 'MASTER_ADMIN' | 'PREFEITO' | 'SECRETARIO_FINANCAS' | 'CONTROLADORIA' | 'SECRETARIA_SETORIAL' | 'VISUALIZADOR_GERAL';
  secretariaRestrita?: string | null;
  ativo: boolean;
  isExtra: boolean;
  ultimoAcesso?: string;
  createdAt: string;
}

@Injectable()
export class UsersService {
  private saasUsers: MockUser[] = [
    {
      id: 'user-ara-1',
      tenantId: 'tenant-araucaria',
      nome: 'Dr. Hissam Hussein Dehaini',
      email: 'gabinete.prefeito@araucaria.pr.gov.br',
      cpf: '381.***.***-04',
      cargo: 'Prefeito Municipal',
      role: 'PREFEITO',
      secretariaRestrita: null,
      ativo: true,
      isExtra: false,
      ultimoAcesso: 'Hoje às 08:35',
      createdAt: '2025-01-15T08:30:00.000Z',
    },
    {
      id: 'user-ara-2',
      tenantId: 'tenant-araucaria',
      nome: 'Geraldo Antonio Gubert',
      email: 'secretario.financas@araucaria.pr.gov.br',
      cpf: '512.***.***-91',
      cargo: 'Secretário Municipal de Finanças',
      role: 'SECRETARIO_FINANCAS',
      secretariaRestrita: null,
      ativo: true,
      isExtra: false,
      ultimoAcesso: 'Hoje às 08:50',
      createdAt: '2025-01-15T08:35:00.000Z',
    },
    {
      id: 'user-ara-3',
      tenantId: 'tenant-araucaria',
      nome: 'Eng. Fernando R. Santos',
      email: 'obras.projetos@araucaria.pr.gov.br',
      cpf: '842.***.***-20',
      cargo: 'Secretário Municipal de Obras Públicas',
      role: 'SECRETARIA_SETORIAL',
      secretariaRestrita: 'SMOP',
      ativo: true,
      isExtra: true,
      ultimoAcesso: 'Ontem às 17:10',
      createdAt: '2025-02-18T10:00:00.000Z',
    },
  ];

  constructor(
    @Inject(TenantsService) private readonly tenantsService: TenantsService,
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository
  ) {}

  getUsersForTenant(tenantId: string) {
    const tenant = this.tenantsService.getTenantById(tenantId);
    const users = this.saasUsers.filter(u => u.tenantId === tenantId);
    const activeCount = users.filter(u => u.ativo).length;
    const userLimit = tenant.userLimit || 2;
    const usuariosExcedentes = Math.max(0, activeCount - userLimit);
    const cobrancaExtraTotal = usuariosExcedentes * (tenant.valorUsuarioExtra || 150);

    return {
      success: true,
      users,
      quota: {
        userLimit,
        totalAtivos: activeCount,
        usuariosInclusos: Math.min(activeCount, userLimit),
        usuariosExcedentes,
        valorUsuarioExtra: tenant.valorUsuarioExtra || 150,
        cobrancaExtraTotal,
        valorMensalBase: tenant.valorMensalBase,
        valorTotalMensalidade: tenant.valorMensalBase + cobrancaExtraTotal,
      },
    };
  }

  getAllUsers(): MockUser[] {
    return this.saasUsers;
  }

  createUser(tenantId: string, dto: any) {
    const tenant = this.tenantsService.getTenantById(tenantId);
    const { nome, email, cpf, cargo, role, secretariaRestrita } = dto;
    if (!nome || !email) {
      throw new BadRequestException('Nome e e-mail são obrigatórios.');
    }

    const currentActiveUsers = this.saasUsers.filter(u => u.tenantId === tenantId && u.ativo).length;
    const willBeExtra = currentActiveUsers >= (tenant.userLimit || 2);

    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      tenantId,
      nome,
      email,
      cpf: cpf || '000.***.***-00',
      cargo: cargo || 'Servidor Municipal',
      role: role || 'SECRETARIA_SETORIAL',
      secretariaRestrita: secretariaRestrita || null,
      ativo: true,
      isExtra: willBeExtra,
      ultimoAcesso: 'Nunca acessou (Convite enviado)',
      createdAt: new Date().toISOString(),
    };

    this.saasUsers.push(newUser);

    const newActiveCount = currentActiveUsers + 1;
    const newExcedentes = Math.max(0, newActiveCount - (tenant.userLimit || 2));
    const newExtraCharge = newExcedentes * (tenant.valorUsuarioExtra || 150);

    return {
      success: true,
      user: newUser,
      isExtraUser: willBeExtra,
      quotaUpdate: {
        totalAtivos: newActiveCount,
        usuariosExcedentes: newExcedentes,
        cobrancaExtraTotal: newExtraCharge,
        valorTotalMensalidade: tenant.valorMensalBase + newExtraCharge,
      },
      message: willBeExtra
        ? `Usuário cadastrado com sucesso como EXCEDENTE (+R$ ${(tenant.valorUsuarioExtra || 150).toFixed(2)}/mês na próxima fatura).`
        : `Usuário cadastrado com sucesso dentro do pacote básico (${newActiveCount}/${tenant.userLimit} inclusos).`,
    };
  }

  updateUser(userId: string, dto: any) {
    const index = this.saasUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new NotFoundException('Usuário não encontrado.');

    this.saasUsers[index] = {
      ...this.saasUsers[index],
      ...dto,
    };

    return { success: true, user: this.saasUsers[index] };
  }

  deleteUser(userId: string) {
    this.saasUsers = this.saasUsers.filter(u => u.id !== userId);
    return { success: true, message: 'Usuário removido com sucesso.' };
  }
}
