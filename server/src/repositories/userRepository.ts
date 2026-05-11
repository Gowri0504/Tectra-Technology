import prisma from '../config/prisma';
import { Prisma, Role } from '@prisma/client';

export class UserRepository {
  async findAll(orgId: string) {
    return prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async update(id: string, orgId: string, data: Prisma.UserUpdateInput) {
    // First verify ownership
    const user = await this.findById(id, orgId);
    if (!user) {
      throw new Error('User not found or unauthorized');
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, orgId: string) {
    // First verify ownership
    const user = await this.findById(id, orgId);
    if (!user) {
      throw new Error('User not found or unauthorized');
    }

    return prisma.user.delete({
      where: { id },
    });
  }
}
