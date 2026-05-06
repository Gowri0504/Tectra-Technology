import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

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
      secure: isProduction, // Must be true for SameSite: None
      sameSite: isProduction ? 'none' : 'strict', // Cross-domain in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, orgName } = registerSchema.parse(req.body);
      const { accessToken, refreshToken } = await this.authService.register(
        email, 
        password, 
        orgName, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, refreshToken);
      res.status(201).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken } = await this.authService.login(
        email, 
        password, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, refreshToken);
      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error('Refresh token required');
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(
        refreshToken, 
        this.getDeviceData(req)
      );
      this.setRefreshTokenCookie(res, newRefreshToken);
      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      res.clearCookie('refreshToken');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
