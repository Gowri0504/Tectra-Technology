"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const transactionRepository_1 = require("../repositories/transactionRepository");
const prisma_1 = __importDefault(require("../config/prisma"));
const cache_1 = require("../utils/cache");
const queues_1 = require("../config/queues");
class TransactionService {
    constructor() {
        this.transactionRepository = new transactionRepository_1.TransactionRepository();
    }
    async createTransaction(userId, orgId, data) {
        return prisma_1.default.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    ...data,
                    userId,
                    organizationId: orgId,
                    tags: data.tags ? {
                        connectOrCreate: data.tags.map((tag) => ({
                            where: { name_organizationId: { name: tag, organizationId: orgId } },
                            create: { name: tag, organizationId: orgId },
                        })),
                    } : undefined,
                },
                include: { tags: true },
            });
            // Invalidate cache
            await cache_1.cache.delByPrefix(`summary:${orgId}`);
            await cache_1.cache.delByPrefix(`transactions:${orgId}`);
            // Budget check
            if (transaction.type === 'EXPENSE') {
                this.checkBudget(orgId, transaction.category, userId);
            }
            return transaction;
        });
    }
    async checkBudget(orgId, category, userId) {
        const period = new Date().toISOString().slice(0, 7); // YYYY-MM
        const budget = await prisma_1.default.budget.findUnique({
            where: { category_period_organizationId: { category, period, organizationId: orgId } },
        });
        if (budget) {
            const totalExpense = await prisma_1.default.transaction.aggregate({
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
                const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
                if (user) {
                    await queues_1.reportQueue.add('budget-alert', {
                        userId,
                        email: user.email,
                        orgId,
                        type: 'BUDGET_ALERT',
                    });
                }
            }
        }
    }
    async getTransactions(orgId, query) {
        const { type, category, startDate, endDate, page = 1, limit = 10, cursor } = query;
        // Caching for frequently accessed first page
        const cacheKey = `transactions:${orgId}:${JSON.stringify(query)}`;
        const cachedData = await cache_1.cache.get(cacheKey);
        if (cachedData)
            return cachedData;
        const skip = cursor ? undefined : (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const result = await this.transactionRepository.findAll(orgId, {
            type: type,
            category: category,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            skip,
            take,
            cursor: cursor ? { id: cursor } : undefined,
        });
        await cache_1.cache.set(cacheKey, result, 300); // 5 min cache
        return result;
    }
    async getDashboardSummary(orgId) {
        const cacheKey = `summary:${orgId}`;
        const cachedSummary = await cache_1.cache.get(cacheKey);
        if (cachedSummary)
            return cachedSummary;
        const summary = await this.transactionRepository.getSummary(orgId);
        const income = summary.find(s => s.type === 'INCOME')?._sum.amount || 0;
        const expense = summary.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
        const balance = Number(income) - Number(expense);
        const result = { income, expense, balance };
        await cache_1.cache.set(cacheKey, result, 600); // 10 min cache
        return result;
    }
    async getTransactionById(id, orgId) {
        return this.transactionRepository.findById(id, orgId);
    }
    async updateTransaction(id, orgId, data) {
        const result = await this.transactionRepository.update(id, orgId, data);
        await cache_1.cache.delByPrefix(`summary:${orgId}`);
        await cache_1.cache.delByPrefix(`transactions:${orgId}`);
        return result;
    }
    async deleteTransaction(id, orgId) {
        const result = await this.transactionRepository.delete(id, orgId);
        await cache_1.cache.delByPrefix(`summary:${orgId}`);
        await cache_1.cache.delByPrefix(`transactions:${orgId}`);
        return result;
    }
}
exports.TransactionService = TransactionService;
