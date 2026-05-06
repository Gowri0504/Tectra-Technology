import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/authRepository';
import { AppError } from '../middlewares/errorHandler';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export class AuthService {
  private authRepository = new AuthRepository();

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(email: string, password: string, orgName: string, deviceData?: any) {
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
      role: 'ADMIN',
    });

    return this.generateTokens(user.id, user.organizationId, user.role, deviceData);
  }

  async login(email: string, password: string, deviceData?: any) {
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
      const updateData: any = { loginAttempts: attempts };
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      
      await this.authRepository.updateUser(user.id, updateData);
      throw new AppError(401, 'Invalid credentials');
    }

    // Reset login attempts on success
    await this.authRepository.updateUser(user.id, { loginAttempts: 0, lockUntil: null });

    return this.generateTokens(user.id, user.organizationId, user.role, deviceData);
  }

  async refreshToken(token: string, deviceData?: any) {
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
      deviceData
    );
  }

  async logout(token: string) {
    const hashedToken = this.hashToken(token);
    await this.authRepository.revokeRefreshToken(hashedToken);
  }

  private async generateTokens(userId: string, orgId: string, role: string, deviceData?: any) {
    const accessToken = jwt.sign({ userId, orgId, role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId, orgId, role }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.createRefreshToken(userId, hashedRefreshToken, expiresAt, deviceData);

    return { accessToken, refreshToken };
  }
}
