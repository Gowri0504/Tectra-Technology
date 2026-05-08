import prisma from '../config/prisma';
import { AuditAction, Prisma } from '@prisma/client';

export class AuditRepository {
  async createLog(data: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    payload?: Prisma.InputJsonValue;
    userId?: string;
    organizationId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data,
    });
  }

  async findByOrg(orgId: string, skip = 0, take = 50) {
    return prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { email: true } } },
    });
  }
}
