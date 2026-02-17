import { useState, useEffect, useRef } from 'react';
import type { CursorUpdatePayload, PresenceLeavePayload } from '@collab-board/shared-types';
import { useSocket } from './useSocket';
import { authStore } from '@/store/authStore';

const CURSOR_REMOVAL_DELAY_MS = 2000;

export interface IRemoteCursor {
  userId: string;
  x: number;
  y: number;
  name?: string;
  color?: string;
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
  const removalTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
      const { userId, x, y, name, color } = payload;
      const existing = removalTimeoutsRef.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        removalTimeoutsRef.current.delete(userId);
      }
      pendingRef.current.set(userId, { userId, x, y, name, color });
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flush);
      }
    };

    const onPresenceLeave = (payload: PresenceLeavePayload): void => {
      const { userId } = payload;
      const timeoutId = setTimeout(() => {
        removalTimeoutsRef.current.delete(userId);
        pendingRef.current.delete(userId);
        rafIdRef.current = requestAnimationFrame(flush);
      }, CURSOR_REMOVAL_DELAY_MS);
      removalTimeoutsRef.current.set(userId, timeoutId);
    };

    socket.on('cursor:update', onCursorUpdate);
    socket.on('presence:leave', onPresenceLeave);

    const timeouts = removalTimeoutsRef.current;
    return () => {
      socket.off('cursor:update', onCursorUpdate);
      socket.off('presence:leave', onPresenceLeave);
      for (const id of timeouts.values()) {
        clearTimeout(id);
      }
      timeouts.clear();
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
