import { create } from 'zustand';
import type { UserPresence } from '@collab-board/shared-types';

interface ICollaborationState {
  onlineUsers: Map<string, UserPresence>;
  setPresenceList: (users: UserPresence[]) => void;
  addPresence: (user: UserPresence) => void;
  removePresence: (userId: string) => void;
  clearPresence: () => void;
}

export const collaborationStore = create<ICollaborationState>((set) => ({
  onlineUsers: new Map(),

  setPresenceList: (users: UserPresence[]) => {
    set({ onlineUsers: new Map(users.map((u) => [u.userId, u])) });
  },

  addPresence: (user: UserPresence) => {
    set((state) => {
      const next = new Map(state.onlineUsers);
      next.set(user.userId, user);
      return { onlineUsers: next };
    });
  },

  removePresence: (userId: string) => {
    set((state) => {
      const next = new Map(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    });
  },

  clearPresence: () => {
    set({ onlineUsers: new Map() });
  },
}));

export function useOnlineUsers(): Map<string, UserPresence> {
  return collaborationStore((state) => state.onlineUsers);
}

export function useOnlineUsersList(): UserPresence[] {
  return collaborationStore((state) => Array.from(state.onlineUsers.values()));
}
