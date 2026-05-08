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
    return prisma.user.update({
      where: { id, organizationId: orgId },
      data,
    });
  }

  async delete(id: string, orgId: string) {
    return prisma.user.delete({
      where: { id, organizationId: orgId },
    });
  }
}
