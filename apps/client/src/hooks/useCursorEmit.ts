import { useRef, useCallback, useEffect } from 'react';
import { throttle } from '@/lib/throttle';
import { getCursorColorForUserId } from '@/lib/cursor-color';
import { authStore } from '@/store/authStore';
import { useSocket } from './useSocket';

const CURSOR_EMIT_INTERVAL_MS = 1000 / 30; // 30fps

/**
 * Returns a handler to call with stage-space (x, y) on pointer move.
 * Emits cursor:move at 30fps when socket is connected.
 */
export function useCursorEmit(): (x: number, y: number) => void {
  const { socket } = useSocket();
  const throttledEmitRef = useRef<((x: number, y: number) => void) | null>(null);

  useEffect(() => {
    if (!socket) {
      throttledEmitRef.current = null;
      return;
    }
    throttledEmitRef.current = throttle(
      ((x: number, y: number) => {
        const userId = authStore.getState().userId;
        socket.emit('cursor:move', {
          x,
          y,
          name: userId ? userId.slice(0, 8) : undefined,
          color: userId ? getCursorColorForUserId(userId) : undefined,
        });
      }) as (...args: unknown[]) => void,
      CURSOR_EMIT_INTERVAL_MS
    ) as (x: number, y: number) => void;
    return () => {
      throttledEmitRef.current = null;
    };
  }, [socket]);

  return useCallback((x: number, y: number) => {
    throttledEmitRef.current?.(x, y);
  }, []);
}
