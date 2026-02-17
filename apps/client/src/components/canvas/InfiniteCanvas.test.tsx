import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfiniteCanvas } from './InfiniteCanvas';
import { boardStore } from '@/store/boardStore';

vi.mock('@/hooks/useBoardRoom', () => ({
  useBoardRoom: () => {},
}));

vi.mock('@/hooks/useContainerSize', () => ({
  useContainerSize: () => ({ width: 800, height: 600 }),
}));

vi.mock('@/hooks/useCursorEmit', () => ({
  useCursorEmit: () => vi.fn(),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    socket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
}));

vi.mock('@/hooks/useObjectSync', () => ({
  useObjectSync: () => {},
}));

vi.mock('@/hooks/useRemoteCursors', () => ({
  useRemoteCursors: () => new Map(),
  useCurrentUserId: () => '',
}));

vi.mock('react-konva', () => ({
  Stage: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'canvas-stage-mock'} />
  ),
  Layer: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'canvas-layer-mock'} />
  ),
  Line: (): null => null,
  Circle: (): null => null,
  Transformer: (): null => null,
  Rect: (): null => null,
}));

describe('InfiniteCanvas', () => {
  beforeEach(() => {
    boardStore.setState({
      boardId: '',
      title: '',
      objects: [],
      boardLoadStatus: 'idle',
    });
  });

  it('shows loading indicator when boardLoadStatus is loading', () => {
    boardStore.setState({ boardLoadStatus: 'loading' });
    render(<InfiniteCanvas />);
    expect(screen.getByTestId('canvas-loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading board…')).toBeInTheDocument();
  });

  it('does not show loading indicator when boardLoadStatus is loaded', () => {
    boardStore.setState({ boardLoadStatus: 'loaded' });
    render(<InfiniteCanvas />);
    expect(screen.queryByTestId('canvas-loading-indicator')).not.toBeInTheDocument();
  });
});
