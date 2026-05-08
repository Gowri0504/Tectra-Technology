import request from 'supertest';
import express from 'express';
import { AuthController } from '../../controllers/authController';
import { errorHandler } from '../../middlewares/errorHandler';
import cookieParser from 'cookie-parser';

// Mocking dependencies
jest.mock('../../services/authService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      register: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
      login: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
    })),
  };
});

const app = express();
app.use(express.json());
app.use(cookieParser());

const authController = new AuthController();
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.use(errorHandler);

describe('Auth Integration Tests', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@test.com',
        password: 'password123',
        orgName: 'New Org',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@tectra.com',
        password: 'admin123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
