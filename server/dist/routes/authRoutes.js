"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
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
router.post('/register', rateLimiter_1.authLimiter, authController.register);
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
router.post('/login', rateLimiter_1.authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
exports.default = router;
