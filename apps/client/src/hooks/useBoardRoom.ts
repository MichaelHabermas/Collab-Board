import { useEffect } from 'react';
import { useSocket } from './useSocket';

/**
 * Joins the socket room for the given board when socket is connected.
 * Emits board:join on connect and reconnect; emits board:leave on unmount or when boardId changes.
 */
export function useBoardRoom(boardId: string): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !boardId) {
      return;
    }

    socket.emit('board:join', { boardId });

    const onConnect = (): void => {
      socket.emit('board:join', { boardId });
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.emit('board:leave', { boardId });
    };
  }, [socket, boardId]);
}
