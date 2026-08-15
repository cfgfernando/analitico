import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FinancialRecord, FinancialCategory, Prisma } from '@prisma/client';

@Injectable()
export class FinancialRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByTenantAndYear(
    tenantId: string,
    exercicioAno: number,
    categoria?: FinancialCategory
  ): Promise<FinancialRecord[]> {
    if (this.prisma.isDbConnected()) {
      return this.prisma.financialRecord.findMany({
        where: {
          tenantId,
          exercicioAno,
          ...(categoria ? { categoria } : {}),
        },
      });
    }
    return [];
  }

  async saveBatch(records: Prisma.FinancialRecordCreateManyInput[]): Promise<number> {
    if (this.prisma.isDbConnected() && records.length > 0) {
      const res = await this.prisma.financialRecord.createMany({
        data: records,
        skipDuplicates: true,
      });
      return res.count;
    }
    return 0;
  }
}
