import { Router } from 'express';
import AdminController from '../controllers/AdminController';
import AuthMiddleware from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// All routes require admin role
router.use(AuthMiddleware.authenticate, AuthMiddleware.authorize(UserRole.ADMIN));

router.post('/tutor-codes', AdminController.generateTutorCode);
router.get('/tutor-codes', AdminController.getTutorCodes);
router.post('/tutor-codes/bulk-delete', AdminController.bulkDeleteTutorCodes);
router.delete('/tutor-codes/:codeId', AdminController.deleteTutorCode);

router.get('/tutors', AdminController.getTutors);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

export default router;
