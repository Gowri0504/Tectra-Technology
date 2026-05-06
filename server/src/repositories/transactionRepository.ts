import prisma from '../config/prisma';
import { Prisma, TransactionType } from '@prisma/client';

export class TransactionRepository {
  async create(data: Prisma.TransactionUncheckedCreateInput) {
    return prisma.transaction.create({
      data,
    });
  }

  async findById(id: string, orgId: string) {
    return prisma.transaction.findFirst({
      where: { id, organizationId: orgId },
    });
  }

  async update(id: string, orgId: string, data: Prisma.TransactionUncheckedUpdateInput) {
    return prisma.transaction.updateMany({
      where: { id, organizationId: orgId },
      data,
    });
  }

  async delete(id: string, orgId: string) {
    return prisma.transaction.deleteMany({
      where: { id, organizationId: orgId },
    });
  }

  async findAll(orgId: string, params: {
    type?: TransactionType;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
    cursor?: Prisma.TransactionWhereUniqueInput;
  }) {
    const { type, category, startDate, endDate, skip, take = 10, cursor } = params;

    const where: Prisma.TransactionWhereInput = {
      organizationId: orgId,
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        cursor,
        orderBy: { date: 'desc' },
        include: { tags: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async getSummary(orgId: string) {
    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where: { organizationId: orgId },
      _sum: {
        amount: true,
      },
    });

    return summary;
  }
}
