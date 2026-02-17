import { describe, expect, it } from 'vitest';
import {
  boardJoinSchema,
  cursorMoveSchema,
  objectCreateSchema,
  objectDeleteSchema,
  objectMoveSchema,
  objectUpdatePayloadSchema,
} from './board.schemas';

describe('board.schemas', () => {
  it('accepts valid board join payload', () => {
    const result = boardJoinSchema.safeParse({ boardId: 'board-1' });
    expect(result.success).toBe(true);
  });

  it('rejects board join payload with missing boardId', () => {
    const result = boardJoinSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts valid cursor move payload', () => {
    const result = cursorMoveSchema.safeParse({ x: 10, y: 20, name: 'A', color: '#fff' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid cursor move payload', () => {
    const result = cursorMoveSchema.safeParse({ x: '10', y: 20 });
    expect(result.success).toBe(false);
  });

  it('accepts valid object create payload', () => {
    const result = objectCreateSchema.safeParse({
      boardId: 'board-1',
      object: {
        boardId: 'board-1',
        type: 'sticky_note',
        x: 100,
        y: 200,
        width: 240,
        height: 120,
        createdBy: 'user-1',
        content: 'hello',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects object create payload with non-positive width', () => {
    const result = objectCreateSchema.safeParse({
      boardId: 'board-1',
      object: {
        boardId: 'board-1',
        type: 'sticky_note',
        x: 100,
        y: 200,
        width: 0,
        height: 120,
        createdBy: 'user-1',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid object move payload', () => {
    const result = objectMoveSchema.safeParse({
      boardId: 'board-1',
      objectId: 'object-1',
      x: 100,
      y: 200,
    });

    expect(result.success).toBe(true);
  });

  it('rejects object move payload with missing objectId', () => {
    const result = objectMoveSchema.safeParse({
      boardId: 'board-1',
      x: 100,
      y: 200,
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid object delete payload', () => {
    const result = objectDeleteSchema.safeParse({
      boardId: 'board-1',
      objectId: 'object-1',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid object update payload', () => {
    const result = objectUpdatePayloadSchema.safeParse({
      boardId: 'board-1',
      objectId: 'object-1',
      delta: {
        x: 1,
        y: 2,
        width: 10,
        height: 20,
        color: '#ff0000',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects object update payload with invalid width in delta', () => {
    const result = objectUpdatePayloadSchema.safeParse({
      boardId: 'board-1',
      objectId: 'object-1',
      delta: {
        width: -10,
      },
    });

    expect(result.success).toBe(false);
  });
});
