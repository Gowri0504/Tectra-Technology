"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class AuditRepository {
    async createLog(data) {
        return prisma_1.default.auditLog.create({
            data,
        });
    }
    async findByOrg(orgId, skip = 0, take = 50) {
        return prisma_1.default.auditLog.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: { user: { select: { email: true } } },
        });
    }
}
exports.AuditRepository = AuditRepository;
