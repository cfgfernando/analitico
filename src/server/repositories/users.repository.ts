import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByTenantId(tenantId: string): Promise<User[]> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
    }
    return [];
  }

  async findById(id: string): Promise<User | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.findUnique({ where: { id } });
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.findUnique({ where: { email } });
    }
    return null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.create({ data });
    }
    return null;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.update({ where: { id }, data });
    }
    return null;
  }

  async delete(id: string): Promise<User | null> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.user.delete({ where: { id } });
    }
    return null;
  }
}
