import prisma from '../config/prisma';
import { Prisma, Role } from '@prisma/client';

export class AuthRepository {
  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        organization: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });
  }

  async createOrganization(name: string) {
    return prisma.organization.create({
      data: { name },
    });
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async revokeRefreshToken(token: string) {
    return prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}
