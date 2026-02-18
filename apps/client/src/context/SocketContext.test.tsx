import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketContext } from './SocketContext';

describe('SocketContext', () => {
  it('useSocketContext returns disconnected default when used outside SocketProvider', () => {
    const { result } = renderHook(() => useSocketContext());
    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.connectionStatus).toBe('disconnected');
  });
});
