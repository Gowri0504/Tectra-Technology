import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';

export class AuthController {
  private authService = new AuthService();

  private getDeviceData(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, orgName } = req.body;
      const { accessToken, refreshToken } = await this.authService.register(
        email, 
        password, 
        orgName, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, refreshToken);
      return sendSuccess(res, 'Registration successful', { accessToken }, 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken } = await this.authService.login(
        email, 
        password, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, refreshToken);
      return sendSuccess(res, 'Login successful', { accessToken });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new AppError(401, 'Refresh token required');
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(
        refreshToken, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, newRefreshToken);
      return sendSuccess(res, 'Token refreshed', { accessToken });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken, this.getDeviceData(req));
      }
      res.clearCookie('refreshToken');
      return sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };
}
