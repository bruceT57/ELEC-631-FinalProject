import { Router } from 'express';
import VirtualSpaceController from '../controllers/VirtualSpaceController';
import AuthMiddleware from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

/**
 * Virtual Space Routes
 */

// POST /api/spaces - Create new space (Tutor only)
router.post(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.createSpace
);

// GET /api/spaces/code/:code - Get space by code (Public for joining)
router.get('/code/:code', VirtualSpaceController.getSpaceByCode);

// POST /api/spaces/join/:code - Join a space (Student)
router.post(
  '/join/:code',
  AuthMiddleware.authenticate,
  VirtualSpaceController.joinSpace
);

// GET /api/spaces/tutor - Get tutor's spaces
router.get(
  '/tutor',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.getTutorSpaces
);

// GET /api/spaces/student - Get student's spaces
router.get(
  '/student',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.STUDENT),
  VirtualSpaceController.getStudentSpaces
);

// GET /api/spaces/:id - Get space by ID
router.get('/:id', AuthMiddleware.authenticate, VirtualSpaceController.getSpaceById);

// PUT /api/spaces/:id/status - Update space status (Tutor only)
router.put(
  '/:id/status',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.updateSpaceStatus
);

// GET /api/spaces/:id/participants - Get participants
router.get(
  '/:id/participants',
  AuthMiddleware.authenticate,
  VirtualSpaceController.getParticipants
);

// DELETE /api/spaces/:id - Delete space (Tutor only)
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.deleteSpace
);

export default router;
