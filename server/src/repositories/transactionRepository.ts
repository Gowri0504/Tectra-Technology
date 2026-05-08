import prisma from '../config/prisma';
import { Prisma, TransactionType } from '@prisma/client';

export interface MonthlySummary {
  month: Date;
  type: TransactionType;
  total: number;
}

export class TransactionRepository {
  async create(data: Prisma.TransactionUncheckedCreateInput) {
    return prisma.transaction.create({
      data,
    });
  }

  async findById(id: string, orgId: string, userId?: string) {
    return prisma.transaction.findFirst({
      where: { 
        id, 
        organizationId: orgId,
        userId: userId || undefined
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        category: true,
        date: true,
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, orgId: string, data: Prisma.TransactionUncheckedUpdateInput, userId?: string) {
    return prisma.transaction.updateMany({
      where: { 
        id, 
        organizationId: orgId,
        userId: userId || undefined
      },
      data,
    });
  }

  async delete(id: string, orgId: string, userId?: string) {
    return prisma.transaction.deleteMany({
      where: { 
        id, 
        organizationId: orgId,
        userId: userId || undefined
      },
    });
  }

  async findAll(orgId: string, params: {
    type?: TransactionType;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    skip?: number;
    take?: number;
    cursor?: Prisma.TransactionWhereUniqueInput;
    userId?: string;
  }) {
    const { type, category, startDate, endDate, search, skip, take = 10, cursor, userId } = params;

    const where: Prisma.TransactionWhereInput = {
      organizationId: orgId,
      userId: userId || undefined
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        cursor,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          category: true,
          date: true,
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async getSummary(orgId: string, userId?: string) {
    const where: Prisma.TransactionWhereInput = { 
      organizationId: orgId,
      userId: userId || undefined
    };

    const typeSummary = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    // PostgreSQL specific monthly summary
    const monthlySummary: MonthlySummary[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE "organizationId" = ${orgId}
      ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
      AND date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY month, type
      ORDER BY month ASC
    `;

    // Category breakdown
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: {
        amount: true,
      },
    });

    return { typeSummary, monthlySummary, categoryBreakdown };
  }
}
