import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SOCKET_RECONNECT_OPTIONS } from './useSocket';

describe('useSocket reconnect configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports explicit reconnection options for exponential backoff', () => {
    expect(SOCKET_RECONNECT_OPTIONS.reconnection).toBe(true);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionAttempts).toBe(Infinity);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionDelay).toBe(1000);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionDelayMax).toBe(30000);
    expect(SOCKET_RECONNECT_OPTIONS.randomizationFactor).toBe(0.5);
  });
});
