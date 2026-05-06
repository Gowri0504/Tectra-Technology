import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middlewares/authMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { AuditAction } from '@prisma/client';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

router.post('/', auditLog(AuditAction.CREATE, 'Transaction'), controller.create);
router.get('/', controller.getAll);
router.get('/export', controller.exportCsv);
router.get('/summary', controller.getSummary);
router.get('/audit', controller.getAuditLogs);
router.get('/:id', controller.getOne);
router.patch('/:id', auditLog(AuditAction.UPDATE, 'Transaction'), controller.update);
router.delete('/:id', auditLog(AuditAction.DELETE, 'Transaction'), controller.delete);

export default router;
