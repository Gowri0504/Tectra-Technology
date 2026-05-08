import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middlewares/authMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { AuditAction } from '@prisma/client';
import { validate } from '../middlewares/validationMiddleware';
import { 
  createTransactionSchema, 
  updateTransactionSchema, 
  getTransactionsSchema 
} from '../validations/transactionValidation';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

/**
 * @openapi
 * /transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, description, category]
 *             properties:
 *               amount: {type: number}
 *               type: {type: string, enum: [INCOME, EXPENSE]}
 *               description: {type: string}
 *               category: {type: string}
 *               date: {type: string, format: date-time}
 *               tags: {type: array, items: {type: string}}
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post('/', validate(createTransactionSchema), auditLog(AuditAction.CREATE, 'Transaction'), controller.create);

/**
 * @openapi
 * /transactions:
 *   get:
 *     summary: Get all transactions for the organization
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: {type: string, enum: [INCOME, EXPENSE]}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 10}
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', validate(getTransactionsSchema), controller.getAll);
router.get('/export', controller.exportCSV);
router.get('/summary', controller.getSummary);
router.get('/audit', controller.getAuditLogs);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(updateTransactionSchema), auditLog(AuditAction.UPDATE, 'Transaction'), controller.update);
router.delete('/:id', auditLog(AuditAction.DELETE, 'Transaction'), controller.delete);

export default router;
