import { describe, it, expect, beforeEach } from 'vitest';
import { collaborationStore } from './collaborationStore';
import type { UserPresence } from '@collab-board/shared-types';

const user1: UserPresence = {
  userId: 'user-1',
  name: 'Alice',
  avatar: '',
  color: '#2563eb',
  cursor: null,
  lastSeen: new Date().toISOString(),
};

const user2: UserPresence = {
  userId: 'user-2',
  name: 'Bob',
  avatar: '',
  color: '#dc2626',
  cursor: null,
  lastSeen: new Date().toISOString(),
};

describe('collaborationStore', () => {
  beforeEach(() => {
    collaborationStore.getState().clearPresence();
  });

  it('setPresenceList replaces online users', () => {
    collaborationStore.getState().setPresenceList([user1, user2]);
    const users = collaborationStore.getState().onlineUsers;
    expect(users.size).toBe(2);
    expect(users.get('user-1')).toEqual(user1);
    expect(users.get('user-2')).toEqual(user2);
  });

  it('addPresence adds a user', () => {
    collaborationStore.getState().addPresence(user1);
    expect(collaborationStore.getState().onlineUsers.get('user-1')).toEqual(user1);
    collaborationStore.getState().addPresence(user2);
    expect(collaborationStore.getState().onlineUsers.size).toBe(2);
  });

  it('removePresence removes a user', () => {
    collaborationStore.getState().setPresenceList([user1, user2]);
    collaborationStore.getState().removePresence('user-1');
    expect(collaborationStore.getState().onlineUsers.size).toBe(1);
    expect(collaborationStore.getState().onlineUsers.has('user-1')).toBe(false);
    expect(collaborationStore.getState().onlineUsers.get('user-2')).toEqual(user2);
  });

  it('clearPresence empties the map', () => {
    collaborationStore.getState().setPresenceList([user1]);
    collaborationStore.getState().clearPresence();
    expect(collaborationStore.getState().onlineUsers.size).toBe(0);
  });
});
