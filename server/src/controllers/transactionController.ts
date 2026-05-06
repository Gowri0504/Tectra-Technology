import { Response, NextFunction } from 'express';
import { TransactionService } from '../services/transactionService';
import { ExportService } from '../services/exportService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.string().optional().transform(val => val ? new Date(val) : new Date()),
});

export class TransactionController {
  private transactionService = new TransactionService();
  private exportService = new ExportService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = transactionSchema.parse(req.body);
      const transaction = await this.transactionService.createTransaction(
        req.user!.userId,
        req.user!.orgId,
        data
      );
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.transactionService.getTransactions(
        req.user!.orgId,
        req.query
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.transactionService.getTransactionById(
        req.params.id,
        req.user!.orgId
      );
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = transactionSchema.partial().parse(req.body);
      const result = await this.transactionService.updateTransaction(
        req.params.id,
        req.user!.orgId,
        data
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.transactionService.deleteTransaction(
        req.params.id,
        req.user!.orgId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await this.transactionService.getDashboardSummary(req.user!.orgId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

  exportCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.exportService.streamTransactionsToCsv(res, req.user!.orgId);
    } catch (error) {
      next(error);
    }
  };
}
