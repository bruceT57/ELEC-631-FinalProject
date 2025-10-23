import { Request, Response, NextFunction } from 'express';
import AuthService, { ITokenPayload } from '../services/AuthService';
import { UserRole } from '../models';

/**
 * Extend Express Request to include user information
 */
export interface AuthRequest extends Request {
  user?: ITokenPayload;
}

/**
 * Authentication Middleware class
 */
class AuthMiddleware {
  /**
   * Verify JWT token from request header
   */
  public authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.substring(7);

      // Verify token
      const payload = AuthService.verifyToken(token);

      // Attach user to request
      req.user = payload;

      next();
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Unauthorized' });
    }
  };

  /**
   * Check if user has required role
   */
  public authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }

      next();
    };
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  public optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = AuthService.verifyToken(token);
        req.user = payload;
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };
}

export default new AuthMiddleware();
