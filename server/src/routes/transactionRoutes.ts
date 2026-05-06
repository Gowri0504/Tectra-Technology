import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/export', controller.exportCsv);
router.get('/summary', controller.getSummary);
router.get('/:id', controller.getOne);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
