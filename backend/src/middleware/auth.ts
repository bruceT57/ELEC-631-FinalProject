import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { UserRole } from "../models/User";

/**
 * The controller imports this as:
 *   import { AuthRequest } from '../middleware/auth';
 * and expects req.user.userId to exist.
 * We define it explicitly here so controllers compile even without any global augmentation.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;            // canonical id
    userId: string;        // alias some controllers/services use
    email: string;
    username: string;
    role?: string;
  };
}

/** Claims embedded in JWTs (adjust keys to match your token issuer) */
interface JwtClaims {
  sub: string;                 // user id
  email: string;
  username: string;
  role?: UserRole | string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticate: requires a valid Bearer token.
 * - Verifies JWT
 * - Populates req.user with both id and userId
 * - 401 on missing/invalid token
 */
function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const secret = (config as any).jwtSecret || process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ error: "Server misconfiguration: missing JWT secret" });
    }

    const decoded = jwt.verify(token, secret) as JwtClaims;

    const uid = decoded.sub;
    req.user = {
      id: uid,               // canonical
      userId: uid,           // alias used by controllers
      email: decoded.email,
      username: decoded.username,
      role: (decoded.role as string) ?? UserRole.STUDENT,
    };

    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Authorize: ensure the authenticated user has one of the allowed roles.
 * Use like: AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN)
 */
function authorize(...allowed: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role as UserRole | undefined;

    if (!role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (allowed.length > 0 && !allowed.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

const AuthMiddleware = { authenticate, authorize };
export default AuthMiddleware;
