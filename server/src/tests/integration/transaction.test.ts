import request from 'supertest';
import express from 'express';
import { TransactionController } from '../../controllers/transactionController';
import { errorHandler } from '../../middlewares/errorHandler';
import { authenticate } from '../../middlewares/authMiddleware';

// Mocking dependencies
jest.mock('../../services/transactionService', () => {
  return {
    TransactionService: jest.fn().mockImplementation(() => ({
      createTransaction: jest.fn().mockResolvedValue({
        id: 'tx-1',
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
        category: 'Food',
      }),
      getTransactions: jest.fn().mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        limit: 10,
      }),
    })),
  };
});

jest.mock('../../services/exportService');

// Mock auth middleware
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'user-1', orgId: 'org-1', role: 'ADMIN' };
    next();
  },
}));

const app = express();
app.use(express.json());

const controller = new TransactionController();
app.post('/api/transactions', authenticate, controller.create);
app.get('/api/transactions', authenticate, controller.getAll);
app.use(errorHandler);

describe('Transaction Integration Tests', () => {
  it('should create a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        amount: 100,
        type: 'EXPENSE',
        description: 'Test transaction',
        category: 'Food',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should get transactions', async () => {
    const res = await request(app)
      .get('/api/transactions');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('transactions');
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });
});
