import { Router } from 'express';
import AdminController from '../controllers/AdminController';
import AuthMiddleware from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

/**
 * Admin Routes - All require ADMIN authentication
 */

// GET /api/admin/users - Get all users
router.get(
  '/users',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.getAllUsers
);

// GET /api/admin/users/statistics - Get user statistics
router.get(
  '/users/statistics',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.getUserStatistics
);

// GET /api/admin/users/:id - Get user by ID
router.get(
  '/users/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.getUserById
);

// POST /api/admin/users - Create new user
router.post(
  '/users',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.createUser
);

// PUT /api/admin/users/:id - Update user
router.put(
  '/users/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.updateUser
);

// DELETE /api/admin/users/:id - Delete user
router.delete(
  '/users/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.deleteUser
);

// PUT /api/admin/users/:id/reset-password - Reset user password
router.put(
  '/users/:id/reset-password',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  AdminController.resetPassword
);

export default router;
