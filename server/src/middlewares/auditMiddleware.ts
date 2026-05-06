import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { AuditRepository } from '../repositories/auditRepository';
import { AuditAction } from '@prisma/client';

const auditRepository = new AuditRepository();

export const auditLog = (action: AuditAction, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = req.method === 'GET' ? null : req.body;
        
        auditRepository.createLog({
          action,
          entityType,
          entityId: req.params.id,
          payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
          userId: req.user?.userId,
          organizationId: req.user?.orgId || '',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalSend.call(this, body);
    };

    next();
  };
};
