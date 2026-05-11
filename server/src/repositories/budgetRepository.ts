import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export class BudgetRepository {
  async upsert(orgId: string, category: string, period: string, amount: number) {
    return prisma.budget.upsert({
      where: {
        category_period_organizationId: {
          category,
          period,
          organizationId: orgId,
        },
      },
      update: { amount },
      create: {
        category,
        amount,
        period,
        organizationId: orgId,
      },
    });
  }

  async findMany(orgId: string, period?: string) {
    return prisma.budget.findMany({
      where: { 
        organizationId: orgId,
        period: period || undefined
      },
    });
  }
}
