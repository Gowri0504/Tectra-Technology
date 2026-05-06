"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const authRepository_1 = require("../repositories/authRepository");
const errorHandler_1 = require("../middlewares/errorHandler");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
class AuthService {
    constructor() {
        this.authRepository = new authRepository_1.AuthRepository();
    }
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    async register(email, password, orgName, deviceData) {
        const existingUser = await this.authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new errorHandler_1.AppError(400, 'User already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const organization = await this.authRepository.createOrganization(orgName);
        const user = await this.authRepository.createUser({
            email,
            password: hashedPassword,
            organization: { connect: { id: organization.id } },
            role: 'ADMIN',
        });
        return this.generateTokens(user.id, user.organizationId, user.role, deviceData);
    }
    async login(email, password, deviceData) {
        const user = await this.authRepository.findUserByEmail(email);
        if (!user) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Brute force check
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw new errorHandler_1.AppError(403, 'Account is temporarily locked. Try again later.');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            const attempts = user.loginAttempts + 1;
            const updateData = { loginAttempts: attempts };
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                updateData.lockUntil = new Date(Date.now() + LOCK_TIME);
            }
            await this.authRepository.updateUser(user.id, updateData);
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Reset login attempts on success
        await this.authRepository.updateUser(user.id, { loginAttempts: 0, lockUntil: null });
        return this.generateTokens(user.id, user.organizationId, user.role, deviceData);
    }
    async refreshToken(token, deviceData) {
        const hashedToken = this.hashToken(token);
        const refreshTokenDoc = await this.authRepository.findRefreshToken(hashedToken);
        if (!refreshTokenDoc || refreshTokenDoc.revoked || refreshTokenDoc.expiresAt < new Date()) {
            if (refreshTokenDoc) {
                // Token reuse detected! Revoke all tokens for this user
                await this.authRepository.revokeAllUserRefreshTokens(refreshTokenDoc.userId);
            }
            throw new errorHandler_1.AppError(401, 'Invalid refresh token');
        }
        // Revoke old token (rotation)
        await this.authRepository.revokeRefreshToken(hashedToken);
        // Generate new tokens
        return this.generateTokens(refreshTokenDoc.user.id, refreshTokenDoc.user.organizationId, refreshTokenDoc.user.role, deviceData);
    }
    async logout(token) {
        const hashedToken = this.hashToken(token);
        await this.authRepository.revokeRefreshToken(hashedToken);
    }
    async generateTokens(userId, orgId, role, deviceData) {
        const accessToken = jsonwebtoken_1.default.sign({ userId, orgId, role }, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, orgId, role }, REFRESH_TOKEN_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });
        const hashedRefreshToken = this.hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.authRepository.createRefreshToken(userId, hashedRefreshToken, expiresAt, deviceData);
        return { accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
