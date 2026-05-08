import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { budgetSchema, getBudgetsSchema } from '../validations/budgetValidation';
import { Role } from '@prisma/client';

const router = Router();
const controller = new BudgetController();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.ACCOUNTANT]), validate(budgetSchema), controller.createOrUpdate);
router.get('/', validate(getBudgetsSchema), controller.getAll);

export default router;
