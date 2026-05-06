import { TransactionRepository } from '../repositories/transactionRepository';
import { TransactionType } from '@prisma/client';
import prisma from '../config/prisma';
import { cache } from '../utils/cache';
import { reportQueue } from '../config/queues';

export class TransactionService {
  private transactionRepository = new TransactionRepository();

  async createTransaction(userId: string, orgId: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          ...data,
          userId,
          organizationId: orgId,
          tags: data.tags ? {
            connectOrCreate: data.tags.map((tag: string) => ({
              where: { name_organizationId: { name: tag, organizationId: orgId } },
              create: { name: tag, organizationId: orgId },
            })),
          } : undefined,
        },
        include: { tags: true },
      });

      // Invalidate cache
      await cache.delByPrefix(`summary:${orgId}`);
      await cache.delByPrefix(`transactions:${orgId}`);

      // Budget check
      if (transaction.type === 'EXPENSE') {
        this.checkBudget(orgId, transaction.category, userId);
      }

      return transaction;
    });
  }

  private async checkBudget(orgId: string, category: string, userId: string) {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const budget = await prisma.budget.findUnique({
      where: { category_period_organizationId: { category, period, organizationId: orgId } },
    });

    if (budget) {
      const totalExpense = await prisma.transaction.aggregate({
        where: {
          organizationId: orgId,
          category,
          type: 'EXPENSE',
          date: {
            gte: new Date(period + '-01'),
          },
        },
        _sum: { amount: true },
      });

      if (Number(totalExpense._sum.amount || 0) > Number(budget.amount)) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          await reportQueue.add('budget-alert', {
            userId,
            email: user.email,
            orgId,
            type: 'BUDGET_ALERT',
          });
        }
      }
    }
  }

  async getTransactions(orgId: string, query: any) {
    const { type, category, startDate, endDate, page = 1, limit = 10, cursor } = query;
    
    // Caching for frequently accessed first page
    const cacheKey = `transactions:${orgId}:${JSON.stringify(query)}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    const skip = cursor ? undefined : (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const result = await this.transactionRepository.findAll(orgId, {
      type: type as TransactionType,
      category: category as string,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take,
      cursor: cursor ? { id: cursor } : undefined,
    });

    await cache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getDashboardSummary(orgId: string) {
    const cacheKey = `summary:${orgId}`;
    const cachedSummary = await cache.get(cacheKey);
    if (cachedSummary) return cachedSummary;

    const summary = await this.transactionRepository.getSummary(orgId);
    
    const income = summary.find(s => s.type === 'INCOME')?._sum.amount || 0;
    const expense = summary.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
    const balance = Number(income) - Number(expense);

    const result = { income, expense, balance };
    await cache.set(cacheKey, result, 600); // 10 min cache
    return result;
  }

  async getTransactionById(id: string, orgId: string) {
    return this.transactionRepository.findById(id, orgId);
  }

  async updateTransaction(id: string, orgId: string, data: any) {
    const result = await this.transactionRepository.update(id, orgId, data);
    await cache.delByPrefix(`summary:${orgId}`);
    await cache.delByPrefix(`transactions:${orgId}`);
    return result;
  }

  async deleteTransaction(id: string, orgId: string) {
    const result = await this.transactionRepository.delete(id, orgId);
    await cache.delByPrefix(`summary:${orgId}`);
    await cache.delByPrefix(`transactions:${orgId}`);
    return result;
  }
}
