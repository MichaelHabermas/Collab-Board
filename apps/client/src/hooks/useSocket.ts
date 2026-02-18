import {
  useSocketContext,
  SOCKET_RECONNECT_OPTIONS,
  type CollabSocket,
  type ConnectionStatus,
  type IUseSocketResult,
} from '@/context/SocketContext';

export type { CollabSocket, ConnectionStatus, IUseSocketResult };
export { SOCKET_RECONNECT_OPTIONS };

/**
 * Returns the single shared Socket.io connection and status for this tab.
 * Must be used inside SocketProvider (e.g. under AuthGuard). If used outside, returns disconnected state.
 */
export const useSocket = (): IUseSocketResult => {
  return useSocketContext();
};
