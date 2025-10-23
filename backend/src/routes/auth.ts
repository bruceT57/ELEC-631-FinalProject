import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import AuthMiddleware from '../middleware/auth';

const router = Router();

/**
 * Authentication Routes
 */

// POST /api/auth/register - Register new user
router.post('/register', AuthController.register);

// POST /api/auth/login - Login user
router.post('/login', AuthController.login);

// GET /api/auth/profile - Get current user profile (Protected)
router.get('/profile', AuthMiddleware.authenticate, AuthController.getProfile);

// PUT /api/auth/profile - Update user profile (Protected)
router.put('/profile', AuthMiddleware.authenticate, AuthController.updateProfile);

// POST /api/auth/change-password - Change password (Protected)
router.post('/change-password', AuthMiddleware.authenticate, AuthController.changePassword);

export default router;
