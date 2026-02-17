import type { Request, Response, NextFunction } from 'express';
import { verifyClerkToken, type IVerifiedAuth } from './clerk-verify';

export type IRequestWithAuth = Request & { auth?: IVerifiedAuth };

/**
 * Middleware that verifies Clerk JWT from Authorization: Bearer <token>.
 * Attaches req.auth with userId and sessionId on success.
 * Sends 401 when token is missing or invalid.
 * Skip this middleware for routes that do not require auth (e.g. /api/health).
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const raw = req.headers['authorization'];
  const token =
    typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7).trim() : undefined;
  const auth = await verifyClerkToken(token);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as IRequestWithAuth).auth = auth;
  next();
};
