import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionStatus } from './ConnectionStatus';
import { useSocket } from '@/hooks/useSocket';

vi.mock('@/hooks/useSocket');

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
      isReconnecting: false,
      error: '',
      connectionStatus: 'disconnected',
    });
  });

  it('renders disconnected state', () => {
    render(<ConnectionStatus />);
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-disconnected')).toBeInTheDocument();
  });

  it('renders connected state', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: {} as never,
      isConnected: true,
      isReconnecting: false,
      error: '',
      connectionStatus: 'connected',
    });
    render(<ConnectionStatus />);
    expect(screen.getByTestId('connection-status-connected')).toBeInTheDocument();
  });

  it('renders reconnecting state', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: {} as never,
      isConnected: false,
      isReconnecting: true,
      error: '',
      connectionStatus: 'reconnecting',
    });
    render(<ConnectionStatus />);
    expect(screen.getByTestId('connection-status-reconnecting')).toBeInTheDocument();
  });
});
