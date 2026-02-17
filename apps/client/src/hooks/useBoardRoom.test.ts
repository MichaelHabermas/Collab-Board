import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocket } from '@/hooks/useSocket';
import { useBoardRoom } from './useBoardRoom';
import { boardStore } from '@/store/boardStore';

vi.mock('@/hooks/useSocket');

describe('useBoardRoom', () => {
  const mockEmit = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();
  const mockSocket = {
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    disconnect: vi.fn(),
  };

  beforeEach(() => {
    mockEmit.mockClear();
    mockOn.mockClear();
    mockOff.mockClear();
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      error: '',
    });
    boardStore.setState({
      boardId: '',
      title: '',
      objects: [],
      boardLoadStatus: 'idle',
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

  it('registers board:load listener and updates store when board:load is emitted', () => {
    renderHook(() => useBoardRoom('board-123'));
    const onBoardLoad = mockOn.mock.calls.find((c) => c[0] === 'board:load')?.[1];
    expect(typeof onBoardLoad).toBe('function');

    const payload = {
      board: {
        id: 'board-123',
        title: 'Test Board',
        ownerId: 'user-1',
        collaborators: [],
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      },
      objects: [
        {
          id: 'obj-1',
          boardId: 'board-123',
          type: 'sticky_note' as const,
          x: 0,
          y: 0,
          width: 100,
          height: 80,
          rotation: 0,
          zIndex: 0,
          color: '#fff',
          createdBy: 'user-1',
          updatedAt: new Date().toISOString(),
          content: 'Hi',
          fontSize: 14,
        },
      ],
      users: [],
    };
    onBoardLoad(payload);

    expect(boardStore.getState().objects).toHaveLength(1);
    expect(boardStore.getState().objects[0].id).toBe('obj-1');
    expect(boardStore.getState().boardId).toBe('board-123');
    expect(boardStore.getState().title).toBe('Test Board');
    expect(boardStore.getState().boardLoadStatus).toBe('loaded');
  });
});
