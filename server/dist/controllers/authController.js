"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    orgName: zod_1.z.string().min(2),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
class AuthController {
    constructor() {
        this.authService = new authService_1.AuthService();
        this.register = async (req, res, next) => {
            try {
                const { email, password, orgName } = registerSchema.parse(req.body);
                const tokens = await this.authService.register(email, password, orgName, this.getDeviceData(req));
                res.status(201).json(tokens);
            }
            catch (error) {
                next(error);
            }
        };
        this.login = async (req, res, next) => {
            try {
                const { email, password } = loginSchema.parse(req.body);
                const tokens = await this.authService.login(email, password, this.getDeviceData(req));
                res.json(tokens);
            }
            catch (error) {
                next(error);
            }
        };
        this.refresh = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken)
                    throw new Error('Refresh token required');
                const tokens = await this.authService.refreshToken(refreshToken, this.getDeviceData(req));
                res.json(tokens);
            }
            catch (error) {
                next(error);
            }
        };
        this.logout = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (refreshToken) {
                    await this.authService.logout(refreshToken);
                }
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        };
    }
    getDeviceData(req) {
        return {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        };
    }
}
exports.AuthController = AuthController;
