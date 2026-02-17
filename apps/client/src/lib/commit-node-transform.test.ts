import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Konva from 'konva';
import { commitNodeTransform, MIN_RESIZE } from './commit-node-transform';
import type { RectangleShape, CircleShape } from '@collab-board/shared-types';

function createMockRectangle(id: string, width: number, height: number): RectangleShape {
  return {
    id,
    boardId: 'board-1',
    type: 'rectangle',
    x: 10,
    y: 20,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    color: '#93c5fd',
    createdBy: 'user-1',
    updatedAt: new Date().toISOString(),
    strokeColor: '#1d4ed8',
    strokeWidth: 2,
    fillOpacity: 0.3,
  };
}

function createMockCircle(id: string, width: number, height: number): CircleShape {
  return {
    id,
    boardId: 'board-1',
    type: 'circle',
    x: 10,
    y: 20,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    color: '#93c5fd',
    createdBy: 'user-1',
    updatedAt: new Date().toISOString(),
    radius: Math.min(width, height) / 2,
    strokeColor: '#1d4ed8',
    strokeWidth: 2,
    fillOpacity: 0.3,
  };
}

describe('commitNodeTransform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not set width or height on the Group node (regression: no extra hit region)', () => {
    const setWidth = vi.fn();
    const setHeight = vi.fn();
    const mockChild = {
      width: vi.fn().mockReturnValue(50),
      height: vi.fn().mockReturnValue(40),
    };
    const node = {
      getAttr: vi.fn((key: string) => (key === 'objectId' ? 'rect-1' : undefined)),
      scaleX: vi.fn().mockReturnValue(1.5),
      scaleY: vi.fn().mockReturnValue(1.5),
      rotation: vi.fn().mockReturnValue(0),
      x: vi.fn().mockReturnValue(10),
      y: vi.fn().mockReturnValue(20),
      width: setWidth,
      height: setHeight,
      getChildren: vi.fn().mockReturnValue([mockChild]),
    } as unknown as Konva.Group;

    const obj = createMockRectangle('rect-1', 100, 80);
    const w = 150;
    const h = 120;

    const result = commitNodeTransform(node, obj, w, h);

    expect(result).not.toBeNull();
    expect(result?.delta).toMatchObject({ width: w, height: h });
    expect(setWidth).not.toHaveBeenCalled();
    expect(setHeight).not.toHaveBeenCalled();
  });

  it('returns null when node has no objectId', () => {
    const node = {
      getAttr: vi.fn().mockReturnValue(undefined),
      scaleX: vi.fn(),
      scaleY: vi.fn(),
      rotation: vi.fn().mockReturnValue(0),
      x: vi.fn().mockReturnValue(0),
      y: vi.fn().mockReturnValue(0),
      getChildren: vi.fn().mockReturnValue([]),
    } as unknown as Konva.Group;

    const obj = createMockRectangle('rect-1', 100, 80);
    const result = commitNodeTransform(node, obj, 100, 80);

    expect(result).toBeNull();
  });

  it('resets scale and rotation on node and returns delta with new dimensions', () => {
    const scaleXFn = vi.fn().mockReturnValue(1.2);
    const scaleYFn = vi.fn().mockReturnValue(0.8);
    const rotationFn = vi.fn().mockReturnValue(15);
    const mockChild = {
      width: vi.fn().mockReturnValue(100),
      height: vi.fn().mockReturnValue(80),
    };
    const node = {
      getAttr: vi.fn((key: string) => (key === 'objectId' ? 'rect-1' : undefined)),
      scaleX: scaleXFn,
      scaleY: scaleYFn,
      rotation: rotationFn,
      x: vi.fn().mockReturnValue(10),
      y: vi.fn().mockReturnValue(20),
      width: vi.fn(),
      height: vi.fn(),
      getChildren: vi.fn().mockReturnValue([mockChild]),
    } as unknown as Konva.Group;

    const obj = createMockRectangle('rect-1', 100, 80);
    const w = 120;
    const h = 64;

    const result = commitNodeTransform(node, obj, w, h);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('rect-1');
    expect(result?.delta).toMatchObject({
      width: w,
      height: h,
      x: 10,
      y: 20,
      rotation: 15,
    });
    expect(scaleXFn).toHaveBeenCalled();
    expect(scaleYFn).toHaveBeenCalled();
    expect(rotationFn).toHaveBeenCalled();
  });

  it('includes radius in delta for circle objects', () => {
    const mockChild = {
      width: vi.fn().mockReturnValue(100),
      height: vi.fn().mockReturnValue(100),
      radiusX: vi.fn(),
      radiusY: vi.fn(),
    };
    const node = {
      getAttr: vi.fn((key: string) => (key === 'objectId' ? 'circle-1' : undefined)),
      scaleX: vi.fn(),
      scaleY: vi.fn(),
      rotation: vi.fn().mockReturnValue(0),
      x: vi.fn().mockReturnValue(0),
      y: vi.fn().mockReturnValue(0),
      width: vi.fn(),
      height: vi.fn(),
      getChildren: vi.fn().mockReturnValue([mockChild]),
    } as unknown as Konva.Group;

    const obj = createMockCircle('circle-1', 100, 60);
    const w = 80;
    const h = 60;

    const result = commitNodeTransform(node, obj, w, h);

    expect(result).not.toBeNull();
    expect(result?.delta.radius).toBe(Math.max(MIN_RESIZE / 2, Math.min(w, h) / 2));
  });
});

describe('MIN_RESIZE', () => {
  it('is 20 for use in transform and resize logic', () => {
    expect(MIN_RESIZE).toBe(20);
  });
});
