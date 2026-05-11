import { TransactionRepository, MonthlySummary } from '../repositories/transactionRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { TransactionType, Transaction, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { cache } from '../utils/cache';
import { reportQueue } from '../config/queues';
import { transactionCount } from '../utils/metrics';

export interface TransactionWithTags {
  id: string;
  amount: Prisma.Decimal;
  type: TransactionType;
  description: string;
  category: string;
  date: Date;
  tags: Array<{ id: string; name: string }>;
}

export interface PaginatedTransactions {
  transactions: TransactionWithTags[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description: string;
  category: string;
  date?: Date;
  tags?: string[];
}

export interface TransactionQuery {
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string;
}

export class TransactionService {
  private transactionRepository = new TransactionRepository();
  private auditRepository = new AuditRepository();

  async createTransaction(userId: string, orgId: string, data: CreateTransactionInput): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          description: data.description,
          category: data.category,
          date: data.date,
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

      // Metrics
      transactionCount.inc({ type: transaction.type, category: transaction.category, orgId });

      // Budget check
      if (transaction.type === 'EXPENSE') {
        this.checkBudget(orgId, transaction.category, userId);
      }

      await this.auditRepository.createLog({
        action: 'CREATE',
        entityType: 'Transaction',
        entityId: transaction.id,
        organizationId: orgId,
        userId: userId,
        payload: data as any,
      });

      return transaction;
    });
  }

  private async checkBudget(orgId: string, category: string, userId: string): Promise<void> {
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

  async getTransactions(orgId: string, query: TransactionQuery, userId?: string, role?: string): Promise<PaginatedTransactions> {
    const { type, category, startDate, endDate, search, page = 1, limit = 10, cursor } = query;
    
    // Caching for frequently accessed first page
    const cacheKey = `transactions:${orgId}:${JSON.stringify(query)}:${userId || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData as PaginatedTransactions;

    const skip = cursor ? undefined : (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // If role is USER, only allow viewing own transactions
    const filterUserId = role === 'USER' ? userId : undefined;

    const result = await this.transactionRepository.findAll(orgId, {
      type: type as TransactionType,
      category: category as string,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search: search as string,
      skip,
      take,
      cursor: cursor ? { id: cursor } : undefined,
      userId: filterUserId,
    });

    const response: PaginatedTransactions = {
      transactions: result.transactions,
      total: result.total,
      page: Number(page),
      limit: Number(limit)
    };

    await cache.set(cacheKey, response, 300); // 5 min cache
    return response;
  }

  async getDashboardSummary(orgId: string, userId?: string, role?: string) {
    const cacheKey = `summary:${orgId}:${role === 'USER' ? userId : 'org'}`;
    const cachedSummary = await cache.get(cacheKey);
    if (cachedSummary) return cachedSummary;

    const filterUserId = role === 'USER' ? userId : undefined;
    const result = await this.transactionRepository.getSummary(orgId, filterUserId);
    await cache.set(cacheKey, result, 3600); // 1 hour cache
    return result;
  }

  async getAuditLogs(orgId: string) {
    return this.auditRepository.findByOrg(orgId);
  }

  async getTransactionById(id: string, orgId: string, userId?: string, role?: string) {
    const filterUserId = role === 'USER' ? userId : undefined;
    return this.transactionRepository.findById(id, orgId, filterUserId);
  }

  async updateTransaction(id: string, orgId: string, data: Partial<CreateTransactionInput>, userId?: string, role?: string): Promise<any> {
    const filterUserId = role === 'USER' ? userId : undefined;
    
    // Convert tags to Prisma update format if present
    const updateData: Prisma.TransactionUncheckedUpdateInput = {
      ...data,
      tags: data.tags ? {
        set: [], // Clear and set new tags
        connectOrCreate: data.tags.map((tag: string) => ({
          where: { name_organizationId: { name: tag, organizationId: orgId } },
          create: { name: tag, organizationId: orgId },
        })),
      } : undefined,
    } as any;

    const result = await this.transactionRepository.update(id, orgId, updateData, filterUserId);

    await this.auditRepository.createLog({
      action: 'UPDATE',
      entityType: 'Transaction',
      entityId: id,
      organizationId: orgId,
      userId: userId,
      payload: data as any,
    });

    await cache.delByPrefix(`summary:${orgId}`);
    await cache.delByPrefix(`transactions:${orgId}`);
    return result;
  }

  async deleteTransaction(id: string, orgId: string, userId?: string, role?: string): Promise<any> {
    const filterUserId = role === 'USER' ? userId : undefined;
    const result = await this.transactionRepository.delete(id, orgId, filterUserId);

    await this.auditRepository.createLog({
      action: 'DELETE',
      entityType: 'Transaction',
      entityId: id,
      organizationId: orgId,
      userId: userId,
    });

    await cache.delByPrefix(`summary:${orgId}`);
    await cache.delByPrefix(`transactions:${orgId}`);
    return result;
  }
}
