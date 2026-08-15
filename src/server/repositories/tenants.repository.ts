import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Tenant, TenantApiConfig, Prisma } from '@prisma/client';

@Injectable()
export class TenantsRepository {
  private readonly logger = new Logger(TenantsRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<Tenant[]> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenant.findMany({
        include: {
          users: true,
          apiConfigs: true,
        },
      });
    }
    return [];
  }

  async findByIdOrIbge(idOrIbge: string): Promise<Tenant | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: idOrIbge }, { codigoIbge: idOrIbge }],
        },
        include: {
          users: true,
          apiConfigs: true,
        },
      });
    }
    return null;
  }

  async create(data: Prisma.TenantCreateInput): Promise<Tenant | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenant.create({ data });
    }
    return null;
  }

  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenant.update({ where: { id }, data });
    }
    return null;
  }

  async delete(id: string): Promise<Tenant | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenant.delete({ where: { id } });
    }
    return null;
  }

  async findApisByTenantId(tenantId: string): Promise<TenantApiConfig[]> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenantApiConfig.findMany({ where: { tenantId } });
    }
    return [];
  }

  async createApi(data: Prisma.TenantApiConfigCreateInput): Promise<TenantApiConfig | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenantApiConfig.create({ data });
    }
    return null;
  }

  async deleteApi(id: string): Promise<TenantApiConfig | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.tenantApiConfig.delete({ where: { id } });
    }
    return null;
  }
}
