import { Response, NextFunction } from 'express';
import { TransactionService } from '../services/transactionService';
import { ExportService } from '../services/exportService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

export class TransactionController {
  private transactionService = new TransactionService();
  private exportService = new ExportService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const transaction = await this.transactionService.createTransaction(
        req.user.userId,
        req.user.orgId,
        req.body
      );
      return sendSuccess(res, 'Transaction created successfully', transaction, 201);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const result = await this.transactionService.getTransactions(
        req.user.orgId,
        req.query,
        req.user.userId,
        req.user.role
      );
      return sendSuccess(res, 'Transactions retrieved successfully', result, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const transaction = await this.transactionService.getTransactionById(
        String(req.params.id),
        req.user.orgId,
        req.user.userId,
        req.user.role
      );
      if (!transaction) throw new AppError(404, 'Transaction not found');
      return sendSuccess(res, 'Transaction retrieved successfully', transaction);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const result = await this.transactionService.updateTransaction(
        String(req.params.id),
        req.user.orgId,
        req.body,
        req.user.userId,
        req.user.role
      );
      return sendSuccess(res, 'Transaction updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      await this.transactionService.deleteTransaction(
        String(req.params.id),
        req.user.orgId,
        req.user.userId,
        req.user.role
      );
      return sendSuccess(res, 'Transaction deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const summary = await this.transactionService.getDashboardSummary(
        req.user.orgId,
        req.user.userId,
        req.user.role
      );
      return sendSuccess(res, 'Summary retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const logs = await this.transactionService.getAuditLogs(req.user.orgId);
      return sendSuccess(res, 'Audit logs retrieved successfully', logs);
    } catch (error) {
      next(error);
    }
  };

  exportCSV = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
      
      await this.exportService.streamTransactionsToCSV(
        res,
        req.user.orgId,
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      next(error);
    }
  };
}
