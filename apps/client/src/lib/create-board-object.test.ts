import { describe, it, expect } from 'vitest';
import { createStickyNote, createRectangle, createCircle, createLine } from './create-board-object';

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

describe('createRectangle', () => {
  it('returns rectangle with defaults', () => {
    const rect = createRectangle('board-1', 5, 10, 'user-1');
    expect(rect.id).toBeDefined();
    expect(rect.type).toBe('rectangle');
    expect(rect.x).toBe(5);
    expect(rect.y).toBe(10);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(80);
    expect(rect.strokeColor).toBeDefined();
    expect(rect.strokeWidth).toBe(2);
    expect(rect.fillOpacity).toBe(0.3);
  });
});

describe('createCircle', () => {
  it('returns circle with radius and defaults', () => {
    const circle = createCircle('board-1', 0, 0, 'user-1');
    expect(circle.id).toBeDefined();
    expect(circle.type).toBe('circle');
    expect(circle.radius).toBe(50);
    expect(circle.width).toBe(100);
    expect(circle.height).toBe(100);
  });
});

describe('createLine', () => {
  it('returns line with points', () => {
    const line = createLine('board-1', 0, 0, 'user-1');
    expect(line.id).toBeDefined();
    expect(line.type).toBe('line');
    expect(line.points).toEqual([0, 0, 100, 0]);
    expect(line.strokeWidth).toBe(2);
  });
});
