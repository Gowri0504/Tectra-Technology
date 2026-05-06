import prisma from '../config/prisma';
import { AuditAction } from '@prisma/client';

export class AuditRepository {
  async createLog(data: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    payload?: any;
    userId?: string;
    organizationId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data,
    });
  }

  async findByOrg(orgId: string, skip: number = 0, take: number = 50) {
    return prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { email: true } } },
    });
  }
}
