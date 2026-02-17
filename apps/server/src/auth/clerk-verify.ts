import { verifyToken } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env['CLERK_SECRET_KEY'];
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

export interface IVerifiedAuth {
  userId: string;
  sessionId: string;
}

/**
 * Verifies a Clerk session JWT (from Authorization: Bearer <token>).
 * Returns decoded payload with userId (sub) and sessionId (sid), or null if invalid/missing.
 */
export const verifyClerkToken = async (
  token: string | undefined
): Promise<IVerifiedAuth | null> => {
  if (!token?.trim()) {
    return null;
  }
  if (!CLERK_SECRET_KEY) {
    return null;
  }
  try {
    const verified = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
      authorizedParties: [CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
    });
    const sub = verified.sub;
    const sid = verified.sid;
    if (typeof sub !== 'string' || typeof sid !== 'string') {
      return null;
    }
    return { userId: sub, sessionId: sid };
  } catch {
    return null;
  }
};
