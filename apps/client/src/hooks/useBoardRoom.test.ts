import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocket } from '@/hooks/useSocket';
import { useBoardRoom } from './useBoardRoom';

vi.mock('@/hooks/useSocket');

describe('useBoardRoom', () => {
  const mockEmit = vi.fn();
  const mockSocket = {
    emit: mockEmit,
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  };

  beforeEach(() => {
    mockEmit.mockClear();
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      error: '',
    });
  });

  it('emits board:join with boardId when socket connected and boardId provided', () => {
    renderHook(() => useBoardRoom('board-123'));
    expect(mockEmit).toHaveBeenCalledWith('board:join', { boardId: 'board-123' });
  });

  it('does not emit when boardId is empty', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      error: '',
    });
    renderHook(() => useBoardRoom(''));
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('emits board:leave on unmount when boardId was set', () => {
    const { unmount } = renderHook(() => useBoardRoom('board-456'));
    expect(mockEmit).toHaveBeenCalledWith('board:join', { boardId: 'board-456' });
    mockEmit.mockClear();
    unmount();
    expect(mockEmit).toHaveBeenCalledWith('board:leave', { boardId: 'board-456' });
  });
});
