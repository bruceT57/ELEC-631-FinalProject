import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import config from '../config/config';
import AuthMiddleware, { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Safely get a string id from a Mongoose document
 */
function docId(user: IUser): string {
  // Mongoose docs typically have both _id (ObjectId) and id (string getter)
  const anyUser = user as any;
  if (anyUser._id && typeof anyUser._id.toString === 'function') return anyUser._id.toString();
  if (typeof anyUser.id === 'string') return anyUser.id;
  return String(anyUser._id ?? anyUser.id); // last resort
}

/**
 * Sign a JWT for a user
 */
function signToken(user: IUser) {
  const secret = (config as any).jwtSecret || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: missing JWT secret');
  }
  const sub = docId(user);
  console.log(`[Auth] Signing token for user ${user.username}, role: ${user.role}`);
  return jwt.sign(
    {
      sub,
      email: user.email,
      username: user.username,
      role: user.role || UserRole.STUDENT,
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * Accepts either flat or { user: {...} } bodies.
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[Auth] Register request body:', JSON.stringify(req.body, null, 2));
    const body = (req.body && (req.body.user ?? req.body)) || {};

    const { firstName, lastName, username, email, password, role } = body as {
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    console.log(`[Auth] Parsed registration data - Role: ${role}`);

    const missing = {
      firstName: !firstName,
      lastName: !lastName,
      username: !username,
      email: !email,
      password: !password,
    };
    if (Object.values(missing).some(Boolean)) {
      return res.status(400).json({ error: 'Missing required fields', details: missing });
    }

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password, // hashed via pre-save hook
      role: role || UserRole.STUDENT,
    });

    console.log(`[Auth] User created - Role in DB: ${user.role}`);

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: docId(user),
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      message: 'Registration successful',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    
    if (err?.name === 'ValidationError') {
      const details: Record<string, string> = {};
      for (const [k, v] of Object.entries(err.errors || {})) {
        details[k] = (v as any).message || 'Invalid field';
      }
      return res.status(400).json({ 
        error: 'User validation failed',
        details,
        fullError: err.message
      });
    }
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'unknown';
      const value = err.keyValue?.[field] || 'unknown';
      return res.status(400).json({ 
        error: `${field} already exists`,
        details: { [field]: `"${value}" is already registered` } 
      });
    }
    
    // Generic error handler
    return res.status(500).json({
      error: 'Registration failed',
      message: err.message || 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/auth/login
 * Accepts either:
 *  - { email, password }  OR
 *  - { username, password }
 * Also accepts { user: { ... } } nesting.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = (req.body && (req.body.user ?? req.body)) || {};
    const { email, username, password } = body as {
      email?: string;
      username?: string;
      password?: string;
    };

    if ((!email && !username) || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { emailOrUsername: !!(email || username), password: !!password },
      });
    }

    const query = email
      ? { email: email.toLowerCase() }
      : { username: (username as string).toLowerCase() };

    // Ensure password field is selected for compare (safe even if schema selects by default)
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.status(200).json({
      token,
      user: {
        id: docId(user),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
});

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

export default router;
