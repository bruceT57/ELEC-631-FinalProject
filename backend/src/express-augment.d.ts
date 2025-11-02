// src/express-augment.d.ts
import "express-serve-static-core";

declare global {
  namespace Express {
    interface UserPayload {
      /** Canonical user id */
      id: string;
      /** Alias used by some controllers/services */
      userId: string;
      email: string;
      username: string;
      role?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
