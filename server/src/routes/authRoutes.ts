import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();
const authController = new AuthController();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user and organization
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, orgName]
 *             properties:
 *               email: {type: string}
 *               password: {type: string}
 *               orgName: {type: string}
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authLimiter, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login to account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: {type: string}
 *               password: {type: string}
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
