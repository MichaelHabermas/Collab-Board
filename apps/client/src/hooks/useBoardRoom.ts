import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { boardStore } from '@/store/boardStore';
import { authStore } from '@/store/authStore';
import type {
  BoardLoadPayload,
  ObjectCreatedPayload,
  ObjectUpdatedPayload,
  ObjectDeletedPayload,
} from '@collab-board/shared-types';

/**
 * Joins the socket room for the given board when socket is connected.
 * Registers board:load and object sync listeners (object:created, object:updated, object:deleted)
 * before emitting board:join so no server events are missed.
 * Emits board:join on connect and reconnect; emits board:leave on unmount or when boardId changes.
 */
export function useBoardRoom(boardId: string): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !boardId) {
      boardStore.getState().setBoardLoadStatus('idle');
      return;
    }

    const onBoardLoad = (payload: BoardLoadPayload): void => {
      boardStore.getState().setObjects(payload.objects);
      boardStore.getState().setBoardMetadata(payload.board.id, payload.board.title);
      boardStore.getState().setBoardLoadStatus('loaded');
    };
    const onObjectCreated = (payload: ObjectCreatedPayload): void => {
      const { object } = payload;
      const state = boardStore.getState();
      const index = state.objects.findIndex((o) => o.id === object.id);
      if (index >= 0) {
        const next = [...state.objects];
        next[index] = object;
        boardStore.setState({ objects: next });
      } else {
        state.addObject(object);
      }
    };
    const onObjectUpdated = (payload: ObjectUpdatedPayload): void => {
      boardStore.getState().updateObject(payload.objectId, payload.delta);
    };
    const onObjectDeleted = (payload: ObjectDeletedPayload): void => {
      boardStore.getState().removeObject(payload.objectId);
    };
    const onConnect = (): void => {
      boardStore.getState().setBoardLoadStatus('loading');
      const { displayName, avatarUrl } = authStore.getState();
      socket.emit('board:join', {
        boardId,
        displayName: displayName || undefined,
        avatarUrl: avatarUrl || undefined,
      });
    };

    socket.on('board:load', onBoardLoad);
    socket.on('object:created', onObjectCreated);
    socket.on('object:updated', onObjectUpdated);
    socket.on('object:deleted', onObjectDeleted);
    socket.on('connect', onConnect);

    boardStore.getState().setBoardLoadStatus('loading');
    const { displayName, avatarUrl } = authStore.getState();
    socket.emit('board:join', {
      boardId,
      displayName: displayName || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    return () => {
      socket.off('board:load', onBoardLoad);
      socket.off('object:created', onObjectCreated);
      socket.off('object:updated', onObjectUpdated);
      socket.off('object:deleted', onObjectDeleted);
      socket.off('connect', onConnect);
      socket.emit('board:leave', { boardId });
      boardStore.getState().setBoardLoadStatus('idle');
    };
  }, [socket, boardId]);
}
