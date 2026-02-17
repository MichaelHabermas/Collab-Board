import { useState, useEffect, useRef } from 'react';
import type { CursorUpdatePayload } from '@collab-board/shared-types';
import { useSocket } from './useSocket';
import { authStore } from '@/store/authStore';

export interface IRemoteCursor {
  userId: string;
  x: number;
  y: number;
}

/**
 * Subscribes to cursor:update and returns map of remote cursor positions.
 * Updates are batched on requestAnimationFrame to limit re-renders.
 */
export function useRemoteCursors(): Map<string, IRemoteCursor> {
  const { socket } = useSocket();
  const [cursors, setCursors] = useState<Map<string, IRemoteCursor>>(new Map());
  const pendingRef = useRef<Map<string, IRemoteCursor>>(new Map());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) {
      queueMicrotask(() => setCursors(new Map()));
      return;
    }

    const flush = (): void => {
      rafIdRef.current = null;
      setCursors(new Map(pendingRef.current));
    };

    const onCursorUpdate = (payload: CursorUpdatePayload): void => {
      const { userId, x, y } = payload;
      pendingRef.current.set(userId, { userId, x, y });
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flush);
      }
    };

    socket.on('cursor:update', onCursorUpdate);

    return () => {
      socket.off('cursor:update', onCursorUpdate);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      pendingRef.current = new Map();
    };
  }, [socket]);

  return cursors;
}

/**
 * Returns current user id for excluding own cursor from remote display.
 */
export function useCurrentUserId(): string {
  return authStore((state) => state.userId);
}
