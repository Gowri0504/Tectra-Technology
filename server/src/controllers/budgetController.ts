import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';

const budgetSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
});

export class BudgetController {
  createOrUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, amount, period } = budgetSchema.parse(req.body);
      const orgId = req.user?.orgId;
      if (!orgId) throw new Error('Org ID required');

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

      res.json(budget);
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
          period: period as string || undefined
        },
      });

      res.json(budgets);
    } catch (error) {
      next(error);
    }
  };
}
