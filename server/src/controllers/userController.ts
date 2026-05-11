import { Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

export class UserController {
  private userService = new UserService();

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const users = await this.userService.getUsers(req.user.orgId);
      return sendSuccess(res, 'Users retrieved successfully', users);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const user = await this.userService.createUser(req.user.orgId, req.body, req.user.userId);
      return sendSuccess(res, 'User created successfully', user, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      const user = await this.userService.updateUser(String(req.params.id), req.user.orgId, req.body, req.user.userId);
      return sendSuccess(res, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'User not authenticated');
      await this.userService.deleteUser(String(req.params.id), req.user.orgId, req.user.userId);
      return sendSuccess(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
