import { describe, it, expect } from 'vitest';
import {
  MIN_LINE_LENGTH,
  computeBoxCreationGeometry,
  computeLineCreationGeometry,
} from './drag-creation-geometry';
import { MIN_RESIZE } from './commit-node-transform';

describe('computeBoxCreationGeometry', () => {
  it('returns normalized rect with min width and height from drag', () => {
    const g = computeBoxCreationGeometry(0, 0, 100, 80);
    expect(g).toEqual({ x: 0, y: 0, width: 100, height: 80 });
  });

  it('clamps small drag to MIN_RESIZE', () => {
    const g = computeBoxCreationGeometry(10, 20, 12, 22);
    expect(g.x).toBe(10);
    expect(g.y).toBe(20);
    expect(g.width).toBe(MIN_RESIZE);
    expect(g.height).toBe(MIN_RESIZE);
  });

  it('handles negative drag (end before start)', () => {
    const g = computeBoxCreationGeometry(100, 80, 20, 10);
    expect(g).toEqual({ x: 20, y: 10, width: 80, height: 70 });
  });

  it('clamps negative-direction small drag to MIN_RESIZE', () => {
    const g = computeBoxCreationGeometry(50, 50, 45, 48);
    expect(g.x).toBe(45);
    expect(g.y).toBe(48);
    expect(g.width).toBe(MIN_RESIZE);
    expect(g.height).toBe(MIN_RESIZE);
  });
});

describe('computeLineCreationGeometry', () => {
  it('returns line from start to end with correct length', () => {
    const g = computeLineCreationGeometry(0, 0, 100, 0);
    expect(g.x).toBe(0);
    expect(g.y).toBe(0);
    expect(g.dx).toBe(100);
    expect(g.dy).toBe(0);
    expect(g.length).toBe(100);
  });

  it('scales short line to MIN_LINE_LENGTH', () => {
    const g = computeLineCreationGeometry(0, 0, 5, 0);
    expect(g.x).toBe(0);
    expect(g.y).toBe(0);
    expect(g.length).toBeGreaterThanOrEqual(MIN_LINE_LENGTH);
    const actualLength = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
    expect(actualLength).toBe(MIN_LINE_LENGTH);
  });

  it('zero-length drag yields horizontal segment of MIN_LINE_LENGTH', () => {
    const g = computeLineCreationGeometry(10, 20, 10, 20);
    expect(g.x).toBe(10);
    expect(g.y).toBe(20);
    expect(g.dx).toBe(MIN_LINE_LENGTH);
    expect(g.dy).toBe(0);
    expect(g.length).toBe(MIN_LINE_LENGTH);
  });

  it('preserves direction when scaling up short diagonal', () => {
    const g = computeLineCreationGeometry(0, 0, 3, 4);
    const origLength = 5;
    expect(origLength).toBeLessThan(MIN_LINE_LENGTH);
    expect(g.length).toBeGreaterThanOrEqual(MIN_LINE_LENGTH);
    const ratio = g.dx / g.dy;
    expect(ratio).toBeCloseTo(3 / 4, 5);
  });
});
