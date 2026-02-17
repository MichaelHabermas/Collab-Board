import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircleShapeComponent } from './CircleShape';
import { boardStore } from '@/store/boardStore';
import { createCircle } from '@/lib/create-board-object';

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: { emit: vi.fn() } }),
}));

let capturedGroupProps: Record<string, unknown> = {};
let capturedBodyEllipseProps: Record<string, unknown> = {};
vi.mock('react-konva', () => ({
  Group: (props: Record<string, unknown>) => {
    capturedGroupProps = { ...props };
    const testId = (props['data-testid'] as string) ?? 'circle-shape-group-mock';
    return <div data-testid={testId}>{props.children as ReactNode}</div>;
  },
  Shape: (_props: Record<string, unknown>) => {
    return <div data-testid="shape-mock" />;
  },
  Ellipse: (props: Record<string, unknown>) => {
    // Capture props from the body Ellipse (the one with hitFunc); ignore the selection ring.
    if (props.hitFunc !== undefined) {
      capturedBodyEllipseProps = { ...props };
      return <div data-testid="circle-body-ellipse-mock" />;
    }
    return <div data-testid="ellipse-mock" />;
  },
}));

describe('CircleShapeComponent', () => {
  beforeEach(() => {
    capturedGroupProps = {};
    capturedBodyEllipseProps = {};
    boardStore.setState({
      boardId: 'board-1',
      objects: [],
      selectedObjectIds: [],
      activeToolType: 'select',
    });
  });

  it('renders circle shape with correct data-testid', () => {
    const circle = createCircle('board-1', 0, 0, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    expect(screen.getByTestId(`object-circle-${circle.id}`)).toBeInTheDocument();
  });

  it('does not pass width or height to Group so hit area is only on the shape', () => {
    const circle = createCircle('board-1', 10, 20, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    expect(capturedGroupProps).not.toHaveProperty('width');
    expect(capturedGroupProps).not.toHaveProperty('height');
  });

  it('Group has listening true so draggable Group is found when Ellipse is hit (hit area is ellipse via hitFunc)', () => {
    const circle = createCircle('board-1', 10, 20, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    expect(capturedGroupProps.listening).toBe(true);
  });

  it('passes hitFunc to body Ellipse (not sceneFunc) so hit area is restricted to elliptical path', () => {
    const circle = createCircle('board-1', 10, 20, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    expect(typeof capturedBodyEllipseProps.hitFunc).toBe('function');
    // sceneFunc is NOT passed — the Ellipse uses its own built-in scene drawing
    expect(capturedBodyEllipseProps.sceneFunc).toBeUndefined();
  });

  it('body Ellipse has hitStrokeWidth=0 so stroke does not expand hit area', () => {
    const circle = createCircle('board-1', 10, 20, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    expect(capturedBodyEllipseProps.hitStrokeWidth).toBe(0);
  });

  it('hitFunc draws ellipse path centered at (0,0) only (no rect), uses fillShape only (no stroke)', () => {
    const circle = createCircle('board-1', 0, 0, 'user-1');
    render(<CircleShapeComponent shape={circle} isSelected={false} />);
    const hitFunc = capturedBodyEllipseProps.hitFunc as (
      context: Record<string, unknown>,
      node: { width: () => number; height: () => number }
    ) => void;
    expect(typeof hitFunc).toBe('function');

    const ellipseCalls: number[][] = [];
    const rectCalls: number[][] = [];
    const mockContext = {
      beginPath: vi.fn(),
      ellipse: vi.fn((...args: number[]) => {
        ellipseCalls.push(args);
      }),
      closePath: vi.fn(),
      fillShape: vi.fn(),
      fillStrokeShape: vi.fn(),
      rect: vi.fn((...args: number[]) => {
        rectCalls.push(args);
      }),
    };
    const width = 80;
    const height = 60;
    const rx = width / 2;
    const ry = height / 2;
    const mockNode = { width: () => width, height: () => height };

    hitFunc(mockContext, mockNode);

    expect(mockContext.beginPath).toHaveBeenCalledTimes(1);
    expect(ellipseCalls).toHaveLength(1);
    // Ellipse is centered at (0, 0) in the node's local space — no offset
    expect(ellipseCalls[0]).toEqual([0, 0, rx, ry, 0, 0, Math.PI * 2]);
    expect(mockContext.closePath).toHaveBeenCalledTimes(1);
    expect(mockContext.fillShape).toHaveBeenCalledTimes(1);
    expect(mockContext.fillShape).toHaveBeenCalledWith(mockNode);
    expect(mockContext.fillStrokeShape).not.toHaveBeenCalled();
    expect(rectCalls).toHaveLength(0);
  });
});
