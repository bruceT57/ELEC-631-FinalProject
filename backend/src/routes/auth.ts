import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import config from '../config/config';
import AuthMiddleware, { AuthRequest } from '../middleware/auth';
import AuthService from '../services/AuthService';
import AuthController from '../controllers/AuthController';

const router = Router();

/**
 * POST /api/auth/register
 */
router.post('/register', AuthController.register.bind(AuthController));

/**
 * POST /api/auth/login
 */
router.post('/login', AuthController.login.bind(AuthController));

/**
 * GET /api/auth/profile
 */
router.get('/profile', AuthMiddleware.authenticate, AuthController.me.bind(AuthController));

/**
 * PUT /api/auth/profile
 */
router.put('/profile', AuthMiddleware.authenticate, AuthController.updateProfile.bind(AuthController));

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', AuthMiddleware.authenticate, AuthController.changePassword.bind(AuthController));

/**
 * DELETE /api/auth/all-users
 * Delete all users from the database (ADMIN ONLY)
 * Requires: Admin authentication
 * ⚠️ WARNING: This is destructive and should only be used in development
 */
router.delete(
  '/all-users',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await User.deleteMany({});
      return res.status(200).json({
        message: 'All users deleted successfully',
        deletedCount: result.deletedCount,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to delete users'
      });
    }
  }
);

/**
 * GET /api/auth/stats - Get user profile stats
 */
router.get('/stats', AuthMiddleware.authenticate, AuthController.getProfileStats.bind(AuthController));

export default router;
