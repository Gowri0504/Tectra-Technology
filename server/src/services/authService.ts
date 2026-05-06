import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/authRepository';
import { AppError } from '../middlewares/errorHandler';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  private authRepository = new AuthRepository();

  async register(email: string, password: string, orgName: string) {
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
      role: 'ADMIN', // First user of org is Admin
    });

    return this.generateTokens(user.id, user.organizationId, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, 'Invalid credentials');
    }

    return this.generateTokens(user.id, user.organizationId, user.role);
  }

  async refreshToken(token: string) {
    const refreshTokenDoc = await this.authRepository.findRefreshToken(token);

    if (!refreshTokenDoc || refreshTokenDoc.revoked || refreshTokenDoc.expiresAt < new Date()) {
      if (refreshTokenDoc) {
        // Token reuse detected! Revoke all tokens for this user
        await this.authRepository.revokeAllUserRefreshTokens(refreshTokenDoc.userId);
      }
      throw new AppError(401, 'Invalid refresh token');
    }

    // Revoke old token (rotation)
    await this.authRepository.revokeRefreshToken(token);

    // Generate new tokens
    return this.generateTokens(
      refreshTokenDoc.user.id,
      refreshTokenDoc.user.organizationId,
      refreshTokenDoc.user.role
    );
  }

  async logout(token: string) {
    await this.authRepository.revokeRefreshToken(token);
  }

  private async generateTokens(userId: string, orgId: string, role: string) {
    const accessToken = jwt.sign({ userId, orgId, role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId, orgId, role }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.createRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}
