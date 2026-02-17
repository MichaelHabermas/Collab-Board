import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDraggableBoardObject } from './useDraggableBoardObject';
import { boardStore } from '@/store/boardStore';

const mockEmit = vi.fn();
vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: { emit: mockEmit }, isConnected: true, error: '' }),
}));

describe('useDraggableBoardObject', () => {
  const objectId = 'obj-1';

  beforeEach(() => {
    mockEmit.mockClear();
    boardStore.setState({
      boardId: 'board-1',
      title: 'Test',
      activeToolType: 'select',
      selectedObjectIds: [],
      objects: [],
    });
  });

  it('returns draggable true when activeToolType is select', () => {
    boardStore.setState({ activeToolType: 'select' });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    expect(result.current.draggable).toBe(true);
  });

  it('returns draggable false when activeToolType is not select', () => {
    boardStore.setState({ activeToolType: 'pan' });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    expect(result.current.draggable).toBe(false);
  });

  it('handleClick without shiftKey calls selectObject', () => {
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    result.current.handleClick({ evt: { shiftKey: false } as MouseEvent });
    expect(boardStore.getState().selectedObjectIds).toEqual([objectId]);
  });

  it('handleClick with shiftKey calls toggleSelection', () => {
    boardStore.setState({ selectedObjectIds: ['other'] });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    result.current.handleClick({ evt: { shiftKey: true } as MouseEvent });
    expect(boardStore.getState().selectedObjectIds).toContain(objectId);
    expect(boardStore.getState().selectedObjectIds).toContain('other');
  });

  it('handlePointerDown with select tool calls selectObject when no shiftKey', () => {
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    result.current.handlePointerDown({ evt: { shiftKey: false } as MouseEvent });
    expect(boardStore.getState().selectedObjectIds).toEqual([objectId]);
  });

  it('handlePointerDown with non-select tool does not call selection', () => {
    boardStore.setState({ activeToolType: 'pan' });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    result.current.handlePointerDown({ evt: { shiftKey: false } as MouseEvent });
    expect(boardStore.getState().selectedObjectIds).toEqual([]);
  });

  it('handleDragEnd updates store and emits object:move when socket and boardId exist', () => {
    boardStore.setState({
      objects: [
        {
          id: objectId,
          boardId: 'board-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
          zIndex: 0,
          color: '#fff',
          strokeColor: '#000',
          strokeWidth: 1,
          fillOpacity: 1,
          updatedAt: '',
          createdBy: '',
        },
      ],
    });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    const target = { x: () => 100, y: () => 200 };
    result.current.handleDragEnd({ target });
    const obj = boardStore.getState().objects.find((o) => o.id === objectId);
    expect(obj?.x).toBe(100);
    expect(obj?.y).toBe(200);
    expect(mockEmit).toHaveBeenCalledWith('object:move', {
      boardId: 'board-1',
      objectId,
      x: 100,
      y: 200,
    });
  });

  it('handleDragMove updates object position in store', () => {
    boardStore.setState({
      objects: [
        {
          id: objectId,
          boardId: 'board-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
          zIndex: 0,
          color: '#fff',
          strokeColor: '#000',
          strokeWidth: 1,
          fillOpacity: 1,
          updatedAt: '',
          createdBy: '',
        },
      ],
    });
    const { result } = renderHook(() => useDraggableBoardObject(objectId));
    result.current.handleDragMove({ target: { x: () => 10, y: () => 20 } });
    const obj = boardStore.getState().objects.find((o) => o.id === objectId);
    expect(obj).toBeDefined();
    expect(obj?.x).toBe(10);
    expect(obj?.y).toBe(20);
  });
});
