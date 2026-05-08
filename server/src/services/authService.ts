import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/authRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { AppError } from '../middlewares/errorHandler';
import { env } from '../config/env';
import { AuditAction, Prisma, Role } from '@prisma/client';
import { loginCount } from '../utils/metrics';

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export interface DeviceData {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private authRepository = new AuthRepository();
  private auditRepository = new AuditRepository();

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(email: string, password: string, orgName: string, deviceData?: DeviceData): Promise<AuthTokens> {
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const organization = await this.authRepository.createOrganization(orgName);

    const user = await this.authRepository.createUser({
      email,
      password: hashedPassword,
      organization: { connect: { id: organization.id } },
      role: Role.ADMIN,
    });

    await this.auditRepository.createLog({
      action: AuditAction.CREATE,
      entityType: 'Organization',
      entityId: organization.id,
      organizationId: organization.id,
      userId: user.id,
      ...deviceData,
    });

    loginCount.inc({ status: 'success', orgId: user.organizationId });

    return this.generateTokens(user.id, user.organizationId, user.role, user.email, deviceData);
  }

  async login(email: string, password: string, deviceData?: DeviceData): Promise<AuthTokens> {
    const user = await this.authRepository.findUserByEmail(email);
    
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Brute force check
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError(403, 'Account is temporarily locked. Try again later.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const attempts = user.loginAttempts + 1;
      const updateData: Prisma.UserUpdateInput = { loginAttempts: attempts };
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      
      await this.authRepository.updateUser(user.id, updateData);
      loginCount.inc({ status: 'failure', orgId: user.organizationId });
      throw new AppError(401, 'Invalid credentials');
    }

    // Reset login attempts on success
    await this.authRepository.updateUser(user.id, { loginAttempts: 0, lockUntil: null });

    await this.auditRepository.createLog({
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      organizationId: user.organizationId,
      userId: user.id,
      ...deviceData,
    });

    return this.generateTokens(user.id, user.organizationId, user.role, user.email, deviceData);
  }

  async refreshToken(token: string, deviceData?: DeviceData): Promise<AuthTokens> {
    const hashedToken = this.hashToken(token);
    const refreshTokenDoc = await this.authRepository.findRefreshToken(hashedToken);

    if (!refreshTokenDoc || refreshTokenDoc.revoked || refreshTokenDoc.expiresAt < new Date()) {
      if (refreshTokenDoc) {
        // Token reuse detected! Revoke all tokens for this user
        await this.authRepository.revokeAllUserRefreshTokens(refreshTokenDoc.userId);
      }
      throw new AppError(401, 'Invalid refresh token');
    }

    // Revoke old token (rotation)
    await this.authRepository.revokeRefreshToken(hashedToken);

    // Generate new tokens
    return this.generateTokens(
      refreshTokenDoc.user.id,
      refreshTokenDoc.user.organizationId,
      refreshTokenDoc.user.role,
      refreshTokenDoc.user.email,
      deviceData
    );
  }

  async logout(token: string, deviceData?: DeviceData): Promise<void> {
    const hashedToken = this.hashToken(token);
    const refreshTokenDoc = await this.authRepository.findRefreshToken(hashedToken);
    if (refreshTokenDoc) {
      await this.auditRepository.createLog({
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: refreshTokenDoc.userId,
        organizationId: refreshTokenDoc.user.organizationId,
        userId: refreshTokenDoc.userId,
        ...deviceData,
      });
    }
    await this.authRepository.revokeRefreshToken(hashedToken);
  }

  private async generateTokens(userId: string, orgId: string, role: string, email: string, deviceData?: DeviceData): Promise<AuthTokens> {
    const accessToken = jwt.sign({ userId, orgId, role, email }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId, orgId, role, email }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.createRefreshToken(userId, hashedRefreshToken, expiresAt, deviceData);

    return { accessToken, refreshToken };
  }
}
