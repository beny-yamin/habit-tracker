import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../config/firebaseAdmin.js';

// Extend Express Request declaration to include Firebase user attributes
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      userId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
  userId?: string;
}

/**
 * Express middleware to cryptographically verify the Firebase ID token in Authorization header.
 * Extracts user UID and attaches it to req.userId and req.user.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header.' });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty bearer token provided.' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Firebase ID token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
}

export default requireAuth;
