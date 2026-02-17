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
vi.mock('react-konva', () => ({
  Group: (props: Record<string, unknown>) => {
    capturedGroupProps = { ...props };
    const testId = (props['data-testid'] as string) ?? 'circle-shape-group-mock';
    return <div data-testid={testId}>{props.children as ReactNode}</div>;
  },
  Ellipse: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
    testId ? <div data-testid={testId} /> : <div data-testid="ellipse-mock" />,
}));

describe('CircleShapeComponent', () => {
  beforeEach(() => {
    capturedGroupProps = {};
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
});
