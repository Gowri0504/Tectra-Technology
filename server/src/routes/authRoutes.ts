import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
