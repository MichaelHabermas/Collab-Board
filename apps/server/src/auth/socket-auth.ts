import type { Socket } from 'socket.io';
import { verifyClerkToken, type IVerifiedAuth } from './clerk-verify';

export interface IAuthenticatedSocket extends Socket {
  data: Socket['data'] & { user: IVerifiedAuth };
}

interface IHandshakeAuth {
  token?: string;
}

/**
 * Socket.io middleware: verifies Clerk JWT from handshake.auth.token.
 * On success sets socket.data.user; on failure calls next(new Error('Unauthorized')).
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  const auth = (socket.handshake.auth as IHandshakeAuth)?.token;
  const user = await verifyClerkToken(typeof auth === 'string' ? auth : undefined);
  if (!user) {
    next(new Error('Unauthorized'));
    return;
  }
  socket.data.user = user;
  next();
};
