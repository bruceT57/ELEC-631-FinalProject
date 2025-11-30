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

// POST /api/spaces/join-anonymous/:code - Join a space anonymously (No auth required)
router.post('/join-anonymous/:code', VirtualSpaceController.joinSpaceAnonymous);

// POST /api/spaces/join/:code - Join a space (Student - deprecated)
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

// POST /api/spaces/:id/summary - Generate AI session summary (Tutor only)
router.post(
  '/:id/summary',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.generateSessionSummary
);

// DELETE /api/spaces/:id - Delete space (Tutor only)
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  VirtualSpaceController.deleteSpace
);

// POST /api/spaces/admin/regenerate-qr-codes - Regenerate all QR codes (Admin only)
// Use this when the server IP address changes
router.post(
  '/admin/regenerate-qr-codes',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const VirtualSpaceService = (await import('../services/VirtualSpaceService')).default;
      const count = await VirtualSpaceService.regenerateAllQRCodes();
      return res.status(200).json({
        message: 'QR codes regenerated successfully',
        updatedCount: count
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to regenerate QR codes'
      });
    }
  }
);

export default router;
