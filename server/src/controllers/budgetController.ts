import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

export class BudgetController {
  createOrUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, amount, period } = req.body;
      const orgId = req.user?.orgId;
      if (!orgId) throw new AppError(400, 'Org ID required');

      const budget = await prisma.budget.upsert({
        where: {
          category_period_organizationId: {
            category,
            period,
            organizationId: orgId,
          },
        },
        update: { amount },
        create: {
          category,
          amount,
          period,
          organizationId: orgId,
        },
      });

      return sendSuccess(res, 'Budget updated successfully', budget);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      const { period } = req.query;
      
      const budgets = await prisma.budget.findMany({
        where: { 
          organizationId: orgId,
          period: period ? String(period) : undefined
        },
      });

      return sendSuccess(res, 'Budgets retrieved successfully', budgets);
    } catch (error) {
      next(error);
    }
  };
}
