import { Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

export class BudgetController {
  private budgetService = new BudgetService();

  createOrUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, amount, period } = req.body;
      const orgId = req.user?.orgId;
      if (!orgId) throw new AppError(400, 'Org ID required');

      const budget = await this.budgetService.createOrUpdateBudget(
        orgId,
        category,
        period,
        amount
      );

      return sendSuccess(res, 'Budget updated successfully', budget);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) throw new AppError(400, 'Org ID required');
      const { period } = req.query;
      
      const budgets = await this.budgetService.getBudgets(
        orgId,
        period ? String(period) : undefined
      );

      return sendSuccess(res, 'Budgets retrieved successfully', budgets);
    } catch (error) {
      next(error);
    }
  };
}
