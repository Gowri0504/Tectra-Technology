import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
const controller = new BudgetController();

router.use(authenticate);

router.post('/', controller.createOrUpdate);
router.get('/', controller.getAll);

export default router;
