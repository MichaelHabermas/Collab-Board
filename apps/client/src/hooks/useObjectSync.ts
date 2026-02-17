import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { boardStore } from '@/store/boardStore';
import type {
  ObjectCreatedPayload,
  ObjectUpdatedPayload,
  ObjectDeletedPayload,
} from '@collab-board/shared-types';

/**
 * Subscribes to object:created, object:updated, object:deleted from server and updates boardStore.
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
    const onObjectUpdated = (payload: ObjectUpdatedPayload): void => {
      const { objectId, delta } = payload;
      boardStore.getState().updateObject(objectId, delta);
    };
    const onObjectDeleted = (payload: ObjectDeletedPayload): void => {
      boardStore.getState().removeObject(payload.objectId);
    };
    socket.on('object:created', onObjectCreated);
    socket.on('object:updated', onObjectUpdated);
    socket.on('object:deleted', onObjectDeleted);
    return () => {
      socket.off('object:created', onObjectCreated);
      socket.off('object:updated', onObjectUpdated);
      socket.off('object:deleted', onObjectDeleted);
    };
  }, [socket]);
}
