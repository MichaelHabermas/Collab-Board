import { describe, it, expect } from 'vitest';
import { createStickyNote } from './create-board-object';

describe('createStickyNote', () => {
  it('returns sticky with required fields and defaults', () => {
    const sticky = createStickyNote('board-1', 10, 20, 'user-1');
    expect(sticky.id).toBeDefined();
    expect(sticky.boardId).toBe('board-1');
    expect(sticky.type).toBe('sticky_note');
    expect(sticky.x).toBe(10);
    expect(sticky.y).toBe(20);
    expect(sticky.width).toBe(120);
    expect(sticky.height).toBe(80);
    expect(sticky.content).toBe('');
    expect(sticky.fontSize).toBe(14);
    expect(sticky.color).toBe('#fef08a');
    expect(sticky.createdBy).toBe('user-1');
    expect(sticky.updatedAt).toBeDefined();
  });

  it('generates unique ids', () => {
    const a = createStickyNote('b', 0, 0, 'u');
    const b = createStickyNote('b', 0, 0, 'u');
    expect(a.id).not.toBe(b.id);
  });
});
