import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socketAuthMiddleware } from './socket-auth';

vi.mock('./clerk-verify', () => ({
  verifyClerkToken: vi.fn(),
}));

const { verifyClerkToken } = await import('./clerk-verify');

describe('socketAuthMiddleware', () => {
  const mockNext = vi.fn();
  const mockSocket = {
    handshake: { auth: {} as { token?: string } },
    data: {} as { user?: { userId: string; sessionId: string } },
  };

  beforeEach(() => {
    vi.mocked(mockNext).mockClear();
    vi.mocked(verifyClerkToken).mockReset();
    mockSocket.data = {};
    mockSocket.handshake.auth = {};
  });

  it('calls next(Error) when token is missing', async () => {
    vi.mocked(verifyClerkToken).mockResolvedValue(null);
    mockSocket.handshake.auth = {};
    await socketAuthMiddleware(mockSocket as never, mockNext);
    expect(verifyClerkToken).toHaveBeenCalledWith(undefined);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next(Error) when token is invalid', async () => {
    vi.mocked(verifyClerkToken).mockResolvedValue(null);
    mockSocket.handshake.auth = { token: 'bad' };
    await socketAuthMiddleware(mockSocket as never, mockNext);
    expect(verifyClerkToken).toHaveBeenCalledWith('bad');
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('sets socket.data.user and calls next() when token is valid', async () => {
    const user = { userId: 'user_1', sessionId: 'sess_1' };
    vi.mocked(verifyClerkToken).mockResolvedValue(user);
    mockSocket.handshake.auth = { token: 'valid-jwt' };
    await socketAuthMiddleware(mockSocket as never, mockNext);
    expect(mockSocket.data.user).toEqual(user);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
