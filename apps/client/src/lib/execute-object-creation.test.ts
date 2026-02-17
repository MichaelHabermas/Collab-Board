import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CollabSocket } from '@/hooks/useSocket';
import { boardStore } from '@/store/boardStore';
import { executeObjectCreation } from './execute-object-creation';

describe('executeObjectCreation', () => {
  beforeEach(() => {
    boardStore.getState().clearBoard();
    boardStore.getState().setActiveTool('select');
  });

  const flushMicrotasks = (): Promise<void> => new Promise((resolve) => queueMicrotask(resolve));

  describe('when socket is null', () => {
    it('adds sticky_note to store', async () => {
      executeObjectCreation(null, 'sticky_note', 'board-1', 10, 20, 'user-1');
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({
        type: 'sticky_note',
        boardId: 'board-1',
        x: 10,
        y: 20,
        createdBy: 'user-1',
      });
    });

    it('adds rectangle to store', async () => {
      executeObjectCreation(null, 'rectangle', 'board-1', 5, 15, 'user-2');
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({
        type: 'rectangle',
        boardId: 'board-1',
        x: 5,
        y: 15,
        createdBy: 'user-2',
      });
    });

    it('adds circle to store', async () => {
      executeObjectCreation(null, 'circle', 'b2', 0, 0, 'anon');
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({ type: 'circle', boardId: 'b2', x: 0, y: 0 });
    });

    it('adds line to store', async () => {
      executeObjectCreation(null, 'line', 'b2', 1, 2, 'anon');
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({ type: 'line', boardId: 'b2', x: 1, y: 2 });
    });

    it('does nothing for select tool', () => {
      executeObjectCreation(null, 'select', 'board-1', 10, 20, 'user-1');
      expect(boardStore.getState().objects).toHaveLength(0);
    });

    it('does nothing for pan tool', () => {
      executeObjectCreation(null, 'pan', 'board-1', 10, 20, 'user-1');
      expect(boardStore.getState().objects).toHaveLength(0);
    });
  });

  describe('when socket is set', () => {
    it('adds to store (optimistic) and emits object:create with id', async () => {
      const emit = vi.fn();
      const socket = { emit } as unknown as CollabSocket;
      executeObjectCreation(socket, 'sticky_note', 'board-1', 10, 20, 'user-1');
      await flushMicrotasks();
      expect(boardStore.getState().objects).toHaveLength(1);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledWith(
        'object:create',
        expect.objectContaining({
          boardId: 'board-1',
          object: expect.objectContaining({
            type: 'sticky_note',
            boardId: 'board-1',
            x: 10,
            y: 20,
            createdBy: 'user-1',
          }),
        })
      );
      const payload = emit.mock.calls[0]?.[1] as { object: Record<string, unknown> };
      expect(payload.object).toHaveProperty('id');
      expect(typeof payload.object.id).toBe('string');
      expect(payload.object).not.toHaveProperty('updatedAt');
    });

    it('emits for rectangle tool', async () => {
      const emit = vi.fn();
      const socket = { emit } as unknown as CollabSocket;
      executeObjectCreation(socket, 'rectangle', 'b1', 0, 0, 'u1');
      await flushMicrotasks();
      expect(emit).toHaveBeenCalledWith(
        'object:create',
        expect.objectContaining({
          boardId: 'b1',
          object: expect.objectContaining({ type: 'rectangle', x: 0, y: 0 }),
        })
      );
    });

    it('switches to select tool after creating an object', async () => {
      boardStore.getState().setActiveTool('sticky_note');
      executeObjectCreation(null, 'sticky_note', 'board-1', 10, 20, 'user-1');
      expect(boardStore.getState().activeToolType).toBe('sticky_note');
      await flushMicrotasks();
      expect(boardStore.getState().activeToolType).toBe('select');
    });

    it('emitted object:create payload has positive width and height for every tool', async () => {
      const emit = vi.fn();
      const socket = { emit } as unknown as CollabSocket;
      const tools = ['sticky_note', 'rectangle', 'circle', 'line'] as const;
      for (const tool of tools) {
        boardStore.getState().clearBoard();
        emit.mockClear();
        executeObjectCreation(socket, tool, 'b1', 0, 0, 'u1');
        await flushMicrotasks();
        const payload = emit.mock.calls[0]?.[1] as { object: { width: number; height: number } };
        expect(payload?.object, `${tool} payload`).toBeDefined();
        expect(payload.object.width, `${tool}.width`).toBeGreaterThan(0);
        expect(payload.object.height, `${tool}.height`).toBeGreaterThan(0);
      }
    });
  });

  describe('with creation payload (drag-to-create)', () => {
    it('creates rectangle with box payload dimensions', async () => {
      executeObjectCreation(null, 'rectangle', 'b1', 0, 0, 'u1', {
        x: 10,
        y: 20,
        width: 60,
        height: 40,
      });
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({
        type: 'rectangle',
        x: 10,
        y: 20,
        width: 60,
        height: 40,
      });
    });

    it('creates circle with center derived from box payload', async () => {
      executeObjectCreation(null, 'circle', 'b1', 0, 0, 'u1', {
        x: 10,
        y: 20,
        width: 60,
        height: 40,
      });
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({
        type: 'circle',
        x: 40,
        y: 40,
        width: 60,
        height: 40,
      });
    });

    it('creates line with line payload start and vector', async () => {
      executeObjectCreation(null, 'line', 'b1', 0, 0, 'u1', {
        x: 5,
        y: 10,
        dx: 80,
        dy: 30,
        length: Math.hypot(80, 30),
      });
      await flushMicrotasks();
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0].type).toBe('line');
      expect(objects[0]).toMatchObject({ x: 5, y: 10 });
      const line = objects[0] as { points: number[] };
      expect(line.points).toEqual([0, 0, 80, 30]);
    });

    it('emitted object:create with box payload has correct dimensions', async () => {
      const emit = vi.fn();
      const socket = { emit } as unknown as CollabSocket;
      executeObjectCreation(socket, 'sticky_note', 'b1', 0, 0, 'u1', {
        x: 1,
        y: 2,
        width: 150,
        height: 90,
      });
      await flushMicrotasks();
      const payload = emit.mock.calls[0]?.[1] as { object: Record<string, unknown> };
      expect(payload.object).toMatchObject({
        type: 'sticky_note',
        x: 1,
        y: 2,
        width: 150,
        height: 90,
      });
    });
  });
});
