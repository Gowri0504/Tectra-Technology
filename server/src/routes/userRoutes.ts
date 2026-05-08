import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { Role, AuditAction } from '@prisma/client';
import { validate } from '../middlewares/validationMiddleware';
import { userCreateSchema, userUpdateSchema } from '../validations/userValidation';

const router = Router();
const controller = new UserController();

router.use(authenticate);
router.use(authorize([Role.ADMIN]));

router.get('/', controller.getAll);
router.post('/', validate(userCreateSchema), auditLog(AuditAction.CREATE, 'User'), controller.create);
router.patch('/:id', validate(userUpdateSchema), auditLog(AuditAction.UPDATE, 'User'), controller.update);
router.delete('/:id', auditLog(AuditAction.DELETE, 'User'), controller.delete);

export default router;
