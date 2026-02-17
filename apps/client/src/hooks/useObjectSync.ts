import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { boardStore } from '@/store/boardStore';
import type { ObjectCreatedPayload } from '@collab-board/shared-types';

/**
 * Subscribes to object:created from server and adds the object to boardStore.
 * Used for real-time object create sync (creator and other clients receive object:created).
 */
export function useObjectSync(): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }
    const onObjectCreated = (payload: ObjectCreatedPayload): void => {
      const { object } = payload;
      const state = boardStore.getState();
      const exists = state.objects.some((o) => o.id === object.id);
      if (!exists) {
        state.addObject(object);
      }
    };
    socket.on('object:created', onObjectCreated);
    return () => {
      socket.off('object:created', onObjectCreated);
    };
  }, [socket]);
}
