import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { boardStore } from '@/store/boardStore';
import type { BoardLoadPayload } from '@collab-board/shared-types';

/**
 * Joins the socket room for the given board when socket is connected.
 * Emits board:join on connect and reconnect; emits board:leave on unmount or when boardId changes.
 * Listens for board:load and updates boardStore with objects and metadata.
 */
export function useBoardRoom(boardId: string): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !boardId) {
      boardStore.getState().setBoardLoadStatus('idle');
      return;
    }

    boardStore.getState().setBoardLoadStatus('loading');
    socket.emit('board:join', { boardId });

    const onBoardLoad = (payload: BoardLoadPayload): void => {
      boardStore.getState().setObjects(payload.objects);
      boardStore.getState().setBoardMetadata(payload.board.id, payload.board.title);
      boardStore.getState().setBoardLoadStatus('loaded');
    };
    socket.on('board:load', onBoardLoad);

    const onConnect = (): void => {
      boardStore.getState().setBoardLoadStatus('loading');
      socket.emit('board:join', { boardId });
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('board:load', onBoardLoad);
      socket.off('connect', onConnect);
      socket.emit('board:leave', { boardId });
      boardStore.getState().setBoardLoadStatus('idle');
    };
  }, [socket, boardId]);
}
