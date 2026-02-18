import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PresencePanel } from './PresencePanel';
import { collaborationStore } from '@/store/collaborationStore';
import { authStore } from '@/store/authStore';

describe('PresencePanel', () => {
  beforeEach(() => {
    collaborationStore.getState().clearPresence();
    authStore.getState().clearUser();
  });

  it('renders panel with data-testid', () => {
    render(<PresencePanel />);
    expect(screen.getByTestId('presence-panel')).toBeInTheDocument();
  });

  it('renders online user names', () => {
    collaborationStore.getState().setPresenceList([
      {
        userId: 'user-1',
        name: 'Alice',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
      {
        userId: 'user-2',
        name: 'Bob',
        avatar: '',
        color: '#dc2626',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
    ]);
    render(<PresencePanel />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('excludes current user from list and shows only others', () => {
    authStore.getState().setUser('user-1');
    collaborationStore.getState().setPresenceList([
      {
        userId: 'user-1',
        name: 'Alice',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
      {
        userId: 'user-2',
        name: 'Bob',
        avatar: '',
        color: '#dc2626',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
    ]);
    render(<PresencePanel />);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows No one else online when only current user is in presence list', () => {
    authStore.getState().setUser('user-1');
    collaborationStore.getState().setPresenceList([
      {
        userId: 'user-1',
        name: 'Alice',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
    ]);
    render(<PresencePanel />);
    expect(screen.getByText('No one else online')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('renders empty when no users', () => {
    render(<PresencePanel />);
    expect(screen.getByTestId('presence-panel')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});
