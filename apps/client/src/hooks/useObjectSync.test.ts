import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useObjectSync } from './useObjectSync';
import { boardStore } from '@/store/boardStore';
import type { StickyNote } from '@collab-board/shared-types';

const createSticky = (overrides: Partial<StickyNote> = {}): StickyNote => ({
  id: 'sticky-uuid-1',
  boardId: 'board-1',
  type: 'sticky_note',
  x: 0,
  y: 0,
  width: 120,
  height: 80,
  rotation: 0,
  zIndex: 0,
  color: '#fef08a',
  createdBy: 'user-1',
  updatedAt: new Date().toISOString(),
  content: '',
  fontSize: 14,
  ...overrides,
});

const socketHandlers: Map<string, (payload: unknown) => void> = new Map();
const mockSocket = {
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    socketHandlers.set(event, handler);
  }),
  off: vi.fn(),
};

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

describe('useObjectSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketHandlers.clear();
    boardStore.getState().clearBoard();
  });

  it('adds object when object:created is received and id does not exist', () => {
    renderHook(() => useObjectSync());
    const onCreated = socketHandlers.get('object:created');
    expect(onCreated).toBeDefined();
    const serverObject = createSticky({
      id: 'new-uuid-from-server',
      content: 'from-server',
    });
    onCreated!({ object: serverObject });
    const objects = boardStore.getState().objects;
    expect(objects).toHaveLength(1);
    expect(objects[0]?.id).toBe('new-uuid-from-server');
    expect(objects[0]).toMatchObject({
      id: serverObject.id,
      type: serverObject.type,
      content: serverObject.content,
    });
    expect(objects[0]?.updatedAt).toBeDefined();
  });

  it('replaces existing object by id when object:created has same id (no duplicate)', () => {
    const optimistic = createSticky({
      id: 'same-uuid',
      content: 'optimistic',
      updatedAt: '2025-01-01T10:00:00.000Z',
    });
    boardStore.getState().addObject(optimistic);
    expect(boardStore.getState().objects).toHaveLength(1);

    renderHook(() => useObjectSync());
    const onCreated = socketHandlers.get('object:created');
    expect(onCreated).toBeDefined();
    const serverObject = createSticky({
      id: 'same-uuid',
      content: 'from-server',
      updatedAt: '2025-01-01T12:00:00.000Z',
    });
    onCreated!({ object: serverObject });

    const objects = boardStore.getState().objects;
    expect(objects).toHaveLength(1);
    expect(objects[0]?.id).toBe('same-uuid');
    expect(objects[0]).toMatchObject(serverObject);
    expect((objects[0] as StickyNote | undefined)?.content).toBe('from-server');
    expect(objects[0]?.updatedAt).toBe('2025-01-01T12:00:00.000Z');
  });

  it('updates store when object:updated is received', () => {
    const obj = createSticky({ id: 'obj-1', x: 0, y: 0 });
    boardStore.getState().addObject(obj);
    renderHook(() => useObjectSync());
    const onUpdated = socketHandlers.get('object:updated');
    expect(onUpdated).toBeDefined();
    onUpdated!({ objectId: 'obj-1', delta: { x: 50, y: 60 } });
    const objects = boardStore.getState().objects;
    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({ id: 'obj-1', x: 50, y: 60 });
  });

  it('removes object when object:deleted is received', () => {
    const obj = createSticky({ id: 'obj-1' });
    boardStore.getState().addObject(obj);
    renderHook(() => useObjectSync());
    const onDeleted = socketHandlers.get('object:deleted');
    expect(onDeleted).toBeDefined();
    onDeleted!({ objectId: 'obj-1' });
    expect(boardStore.getState().objects).toHaveLength(0);
  });
});
