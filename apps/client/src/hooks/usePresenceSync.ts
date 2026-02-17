import { useEffect } from 'react';
import type {
  PresenceJoinPayload,
  PresenceLeavePayload,
  PresenceListPayload,
} from '@collab-board/shared-types';
import { useSocket } from './useSocket';
import { collaborationStore } from '@/store/collaborationStore';

/**
 * Subscribes to presence:join, presence:leave, presence:list and keeps
 * collaborationStore.onlineUsers in sync. Cursor cleanup on presence:leave
 * is handled by useRemoteCursors.
 */
export function usePresenceSync(): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      collaborationStore.getState().clearPresence();
      return;
    }

    const onPresenceList = (payload: PresenceListPayload): void => {
      collaborationStore.getState().setPresenceList(payload.users);
    };

    const onPresenceJoin = (payload: PresenceJoinPayload): void => {
      collaborationStore.getState().addPresence(payload.user);
    };

    const onPresenceLeave = (payload: PresenceLeavePayload): void => {
      collaborationStore.getState().removePresence(payload.userId);
    };

    socket.on('presence:list', onPresenceList);
    socket.on('presence:join', onPresenceJoin);
    socket.on('presence:leave', onPresenceLeave);

    return () => {
      socket.off('presence:list', onPresenceList);
      socket.off('presence:join', onPresenceJoin);
      socket.off('presence:leave', onPresenceLeave);
      collaborationStore.getState().clearPresence();
    };
  }, [socket]);
}
