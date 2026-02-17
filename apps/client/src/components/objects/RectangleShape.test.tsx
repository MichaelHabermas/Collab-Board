import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RectangleShapeComponent } from './RectangleShape';
import { boardStore } from '@/store/boardStore';
import { createRectangle } from '@/lib/create-board-object';

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: { emit: vi.fn() } }),
}));

let capturedGroupProps: Record<string, unknown> = {};
vi.mock('react-konva', () => ({
  Group: (props: Record<string, unknown>) => {
    capturedGroupProps = { ...props };
    const testId = (props['data-testid'] as string) ?? 'rectangle-shape-group-mock';
    return <div data-testid={testId}>{props.children as ReactNode}</div>;
  },
  Rect: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
    testId ? <div data-testid={testId} /> : null,
}));

describe('RectangleShapeComponent', () => {
  beforeEach(() => {
    capturedGroupProps = {};
    boardStore.setState({
      boardId: 'board-1',
      objects: [],
      selectedObjectIds: [],
      activeToolType: 'select',
    });
  });

  it('renders rectangle shape with correct data-testid', () => {
    const rect = createRectangle('board-1', 0, 0, 'user-1');
    render(<RectangleShapeComponent shape={rect} isSelected={false} />);
    expect(screen.getByTestId(`object-rectangle-${rect.id}`)).toBeInTheDocument();
  });

  it('does not pass width or height to Group so hit area is only on the shape (no extra hit region when rotated)', () => {
    const rect = createRectangle('board-1', 10, 20, 'user-1');
    render(<RectangleShapeComponent shape={rect} isSelected={false} />);
    expect(capturedGroupProps).not.toHaveProperty('width');
    expect(capturedGroupProps).not.toHaveProperty('height');
  });

  it('Group has listening true so draggable Group is found when Rect is hit', () => {
    const rect = createRectangle('board-1', 10, 20, 'user-1');
    render(<RectangleShapeComponent shape={rect} isSelected={false} />);
    expect(capturedGroupProps.listening).toBe(true);
  });
});
