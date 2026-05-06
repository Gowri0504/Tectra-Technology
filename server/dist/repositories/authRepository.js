"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class AuthRepository {
    async createUser(data) {
        return prisma_1.default.user.create({
            data,
            include: {
                organization: true,
            },
        });
    }
    async findUserByEmail(email) {
        return prisma_1.default.user.findUnique({
            where: { email },
            include: {
                organization: true,
            },
        });
    }
    async createOrganization(name) {
        return prisma_1.default.organization.create({
            data: { name },
        });
    }
    async createRefreshToken(userId, token, expiresAt, deviceData) {
        return prisma_1.default.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
                ...deviceData,
            },
        });
    }
    async findUserById(id) {
        return prisma_1.default.user.findUnique({
            where: { id },
            include: { organization: true },
        });
    }
    async updateUser(id, data) {
        return prisma_1.default.user.update({
            where: { id },
            data,
        });
    }
    async findRefreshToken(token) {
        return prisma_1.default.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }
    async revokeRefreshToken(token) {
        return prisma_1.default.refreshToken.update({
            where: { token },
            data: { revoked: true },
        });
    }
    async revokeAllUserRefreshTokens(userId) {
        return prisma_1.default.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
        });
    }
}
exports.AuthRepository = AuthRepository;
