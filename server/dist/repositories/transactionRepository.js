"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class TransactionRepository {
    async create(data) {
        return prisma_1.default.transaction.create({
            data,
        });
    }
    async findById(id, orgId) {
        return prisma_1.default.transaction.findFirst({
            where: { id, organizationId: orgId },
        });
    }
    async update(id, orgId, data) {
        return prisma_1.default.transaction.updateMany({
            where: { id, organizationId: orgId },
            data,
        });
    }
    async delete(id, orgId) {
        return prisma_1.default.transaction.deleteMany({
            where: { id, organizationId: orgId },
        });
    }
    async findAll(orgId, params) {
        const { type, category, startDate, endDate, skip, take = 10, cursor } = params;
        const where = {
            organizationId: orgId,
        };
        if (type)
            where.type = type;
        if (category)
            where.category = category;
        if (startDate || endDate) {
            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }
        const [transactions, total] = await Promise.all([
            prisma_1.default.transaction.findMany({
                where,
                skip,
                take,
                cursor,
                orderBy: { date: 'desc' },
                include: { tags: true },
            }),
            prisma_1.default.transaction.count({ where }),
        ]);
        return { transactions, total };
    }
    async getSummary(orgId) {
        const summary = await prisma_1.default.transaction.groupBy({
            by: ['type'],
            where: { organizationId: orgId },
            _sum: {
                amount: true,
            },
        });
        return summary;
    }
}
exports.TransactionRepository = TransactionRepository;
