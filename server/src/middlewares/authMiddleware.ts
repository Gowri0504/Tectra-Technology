import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { Role } from '@prisma/client';
import { env } from '../config/env';

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: Role;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthRequest['user'];
    req.user = payload;
    next();
  } catch (error) {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden'));
    }
    next();
  };
};
