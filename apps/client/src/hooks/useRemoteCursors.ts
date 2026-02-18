import { useState, useEffect, useRef } from 'react';
import type { CursorUpdatePayload, PresenceLeavePayload } from '@collab-board/shared-types';
import { useSocket } from './useSocket';
import { authStore } from '@/store/authStore';

const CURSOR_REMOVAL_DELAY_MS = 2000;

/** Lerp factor for smoothing: 1 = instant, lower = smoother. */
const CURSOR_LERP_FACTOR = 0.25;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface IRemoteCursor {
  userId: string;
  x: number;
  y: number;
  name?: string;
  color?: string;
}

/**
 * Subscribes to cursor:update and returns map of remote cursor positions.
 * Interpolates positions toward latest updates for smooth motion under jitter.
 * Updates are batched on requestAnimationFrame to limit re-renders.
 */
export function useRemoteCursors(): Map<string, IRemoteCursor> {
  const { socket } = useSocket();
  const [cursors, setCursors] = useState<Map<string, IRemoteCursor>>(new Map());
  const targetRef = useRef<Map<string, IRemoteCursor>>(new Map());
  const displayRef = useRef<Map<string, IRemoteCursor>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const removalTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!socket) {
      queueMicrotask(() => setCursors(new Map()));
      return;
    }

    const tick = (): void => {
      rafIdRef.current = null;
      const target = targetRef.current;
      const display = displayRef.current;
      let changed = false;
      for (const [userId, t] of target) {
        const cur = display.get(userId);
        const x = cur !== undefined ? lerp(cur.x, t.x, CURSOR_LERP_FACTOR) : t.x;
        const y = cur !== undefined ? lerp(cur.y, t.y, CURSOR_LERP_FACTOR) : t.y;
        const near = Math.abs(x - t.x) < 0.5 && Math.abs(y - t.y) < 0.5;
        display.set(userId, {
          userId: t.userId,
          x: near ? t.x : x,
          y: near ? t.y : y,
          name: t.name,
          color: t.color,
        });
        changed = true;
      }
      for (const userId of display.keys()) {
        if (!target.has(userId)) {
          display.delete(userId);
          changed = true;
        }
      }
      if (changed) {
        setCursors(new Map(display));
      }
      if (target.size > 0) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    const onCursorUpdate = (payload: CursorUpdatePayload): void => {
      const { userId, x, y, name, color } = payload;
      const existing = removalTimeoutsRef.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        removalTimeoutsRef.current.delete(userId);
      }
      targetRef.current.set(userId, { userId, x, y, name, color });
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    const onPresenceLeave = (payload: PresenceLeavePayload): void => {
      const { userId } = payload;
      const timeoutId = setTimeout(() => {
        removalTimeoutsRef.current.delete(userId);
        targetRef.current.delete(userId);
        displayRef.current.delete(userId);
      }, CURSOR_REMOVAL_DELAY_MS);
      removalTimeoutsRef.current.set(userId, timeoutId);
    };

    socket.on('cursor:update', onCursorUpdate);
    socket.on('presence:leave', onPresenceLeave);

    if (targetRef.current.size > 0) {
      rafIdRef.current = requestAnimationFrame(tick);
    }

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
        rafIdRef.current = null;
      }
      targetRef.current = new Map();
      displayRef.current = new Map();
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
