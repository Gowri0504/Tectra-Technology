import { TransactionRepository } from '../repositories/transactionRepository';
import { AppError } from '../middlewares/errorHandler';
import { TransactionType } from '@prisma/client';
import prisma from '../config/prisma';

export class TransactionService {
  private transactionRepository = new TransactionRepository();

  async createTransaction(userId: string, orgId: string, data: any) {
    // Financial consistency: Using DB transactions for partial writes protection
    return prisma.$transaction(async (tx) => {
      return tx.transaction.create({
        data: {
          ...data,
          userId,
          organizationId: orgId,
        },
      });
    });
  }

  async getTransactions(orgId: string, query: any) {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    return this.transactionRepository.findAll(orgId, {
      type: type as TransactionType,
      category: category as string,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take,
    });
  }

  async getTransactionById(id: string, orgId: string) {
    const transaction = await this.transactionRepository.findById(id, orgId);
    if (!transaction) throw new AppError(404, 'Transaction not found');
    return transaction;
  }

  async updateTransaction(id: string, orgId: string, data: any) {
    const result = await this.transactionRepository.update(id, orgId, data);
    if (result.count === 0) throw new AppError(404, 'Transaction not found');
    return { message: 'Updated successfully' };
  }

  async deleteTransaction(id: string, orgId: string) {
    const result = await this.transactionRepository.delete(id, orgId);
    if (result.count === 0) throw new AppError(404, 'Transaction not found');
    return { message: 'Deleted successfully' };
  }

  async getDashboardSummary(orgId: string) {
    const summary = await this.transactionRepository.getSummary(orgId);
    
    const income = summary.find(s => s.type === 'INCOME')?._sum.amount || 0;
    const expense = summary.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
    const balance = Number(income) - Number(expense);

    return { income, expense, balance };
  }
}
