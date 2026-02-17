import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Board } from './Board';

const mockWidth = 800;
const mockHeight = 600;

vi.mock('@/hooks/useViewportSize', () => ({
  useViewportSize: () => ({ width: mockWidth, height: mockHeight }),
}));

vi.mock('@/hooks/useCursorEmit', () => ({
  useCursorEmit: () => vi.fn(),
}));

vi.mock('@/hooks/useRemoteCursors', () => ({
  useRemoteCursors: () => new Map(),
  useCurrentUserId: () => '',
}));

vi.mock('react-konva', () => ({
  Stage: ({
    width,
    height,
    'data-testid': testId,
    children,
  }: {
    width: number;
    height: number;
    'data-testid'?: string;
    children: ReactNode;
  }) => (
    <div data-testid={testId ?? 'canvas-stage-mock'} data-width={width} data-height={height}>
      {children}
    </div>
  ),
  Layer: ({
    'data-testid': testId,
    children,
  }: {
    'data-testid'?: string;
    children?: ReactNode;
  }) => <div data-testid={testId ?? 'canvas-layer-mock'}>{children}</div>,
  Line: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
    testId ? <div data-testid={testId} /> : null,
  Circle: (): null => null,
  Transformer: (): null => null,
  Rect: (): null => null,
}));

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Stage with viewport dimensions', () => {
    render(<Board />);
    const stage = screen.getByTestId('canvas-board-stage');
    expect(stage).toBeInTheDocument();
    expect(stage).toHaveAttribute('data-width', String(mockWidth));
    expect(stage).toHaveAttribute('data-height', String(mockHeight));
  });

  it('renders four layers: grid, objects, selection, cursor', () => {
    render(<Board />);
    expect(screen.getByTestId('canvas-board-layer-grid')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-board-layer-objects')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-board-layer-selection')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-board-layer-cursor')).toBeInTheDocument();
  });

  it('renders grid background on grid layer', () => {
    render(<Board />);
    expect(screen.getByTestId('canvas-grid-horizontal')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-grid-vertical')).toBeInTheDocument();
  });
});
