import { Router } from 'express';
import ArchivingController from '../controllers/ArchivingController';
import AuthMiddleware from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

/**
 * Archiving Routes
 */

// GET /api/archives - Get archived spaces
router.get(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  ArchivingController.getArchivedSpaces
);

// GET /api/archives/:sessionId - Get archived space details
router.get(
  '/:sessionId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  ArchivingController.getArchivedSpaceDetails
);

// POST /api/archives/manual/:spaceId - Manually archive a space (Tutor only)
router.post(
  '/manual/:spaceId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  ArchivingController.manualArchive
);

// POST /api/archives/trigger - Trigger archiving of expired spaces (Admin only)
router.post(
  '/trigger',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  ArchivingController.triggerArchiving
);

// DELETE /api/archives/:sessionId - Delete an archived session (Admin only)
router.delete(
  '/:sessionId',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  ArchivingController.deleteArchivedSession
);

export default router;
