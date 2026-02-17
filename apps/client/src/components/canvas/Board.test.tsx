import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Board } from './Board';
import { boardStore } from '@/store/boardStore';
import { createStickyNote } from '@/lib/create-board-object';

const mockWidth = 800;
const mockHeight = 600;

const mockSetStagePosition = vi.fn();

vi.mock('@/hooks/useContainerSize', () => ({
  useContainerSize: () => ({ width: mockWidth, height: mockHeight }),
}));

vi.mock('@/hooks/usePanZoom', () => ({
  usePanZoom: () => ({
    stagePosition: { x: 0, y: 0 },
    stageScale: 1,
    setStagePosition: mockSetStagePosition,
    handleWheel: vi.fn(),
    handleStageDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    containerRef: { current: null },
  }),
}));

vi.mock('@/hooks/useCursorEmit', () => ({
  useCursorEmit: () => vi.fn(),
}));

let mockSocketValue: { emit: ReturnType<typeof vi.fn> } | null = { emit: vi.fn() };
vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: mockSocketValue }),
}));

vi.mock('@/hooks/useObjectSync', () => ({
  useObjectSync: () => {},
}));

vi.mock('@/hooks/useRemoteCursors', () => ({
  useRemoteCursors: () => new Map(),
  useCurrentUserId: () => '',
}));

vi.mock('react-konva', () => {
  function makeKonvaMouseEvent(domEvt: MouseEvent): {
    target: {
      getStage: () => {
        getPointerPosition: () => { x: number; y: number };
      };
      getType: () => string;
    };
    evt: MouseEvent;
  } {
    return {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: domEvt.clientX, y: domEvt.clientY }),
        }),
        getType: () => 'Layer',
      },
      evt: domEvt,
    };
  }
  return {
    Stage: ({
      width,
      height,
      'data-testid': testId,
      draggable,
      onMouseDown,
      onMouseUp,
      children,
    }: {
      width: number;
      height: number;
      'data-testid'?: string;
      draggable?: boolean;
      onMouseDown?: (e: unknown) => void;
      onMouseUp?: (e: unknown) => void;
      children: ReactNode;
    }) => (
      <div
        data-testid={testId ?? 'canvas-stage-mock'}
        data-width={width}
        data-height={height}
        data-draggable={String(draggable ?? false)}
        onMouseDown={(e: React.MouseEvent) => onMouseDown?.(makeKonvaMouseEvent(e.nativeEvent))}
        onMouseUp={(e: React.MouseEvent) => onMouseUp?.(makeKonvaMouseEvent(e.nativeEvent))}
      >
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
    Group: ({
      'data-testid': testId,
      children,
    }: {
      'data-testid'?: string;
      children?: ReactNode;
    }) => <div data-testid={testId ?? 'canvas-group-mock'}>{children}</div>,
    Line: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
      testId ? <div data-testid={testId} /> : null,
    Circle: (): null => null,
    Transformer: (): null => null,
    Rect: (): null => null,
    Text: (): null => null,
  };
});

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketValue = { emit: vi.fn() };
  });

  it('renders Stage with container dimensions', () => {
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

  it('renders pre-seeded objects in the DOM without looping', () => {
    const sticky = createStickyNote('test-board', 10, 20, 'test-user');
    boardStore.getState().clearBoard();
    boardStore.getState().setObjects([sticky]);
    boardStore.getState().setBoardMetadata('test-board', 'Test');
    render(<Board />);
    expect(screen.getByTestId(`object-sticky-${sticky.id}`)).toBeInTheDocument();
  });

  it('renders grid background on grid layer', () => {
    render(<Board />);
    expect(screen.getByTestId('canvas-grid-horizontal')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-grid-vertical')).toBeInTheDocument();
  });

  it('Stage is not draggable when select tool is active', () => {
    boardStore.getState().setActiveTool('select');
    render(<Board />);
    const stage = screen.getByTestId('canvas-board-stage');
    expect(stage).toHaveAttribute('data-draggable', 'false');
  });

  it('Stage is draggable when pan tool is active', () => {
    boardStore.getState().setActiveTool('pan');
    render(<Board />);
    const stage = screen.getByTestId('canvas-board-stage');
    expect(stage).toHaveAttribute('data-draggable', 'true');
  });

  const flushMicrotasks = (): Promise<void> => new Promise((resolve) => queueMicrotask(resolve));

  describe('object creation (click on stage with creation tool)', () => {
    it('adds object to store when socket is null (local creation)', async () => {
      mockSocketValue = null;
      boardStore.getState().clearBoard();
      boardStore.getState().setActiveTool('sticky_note');
      render(<Board />);
      const stage = screen.getByTestId('canvas-board-stage');
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseUp(stage, { clientX: 100, clientY: 100, button: 0 });
      await act(flushMicrotasks);
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({ type: 'sticky_note' });
      expect(screen.getByTestId(`object-sticky-${objects[0].id}`)).toBeInTheDocument();
    });

    it('adds to store (optimistic) and emits object:create when socket is set', async () => {
      const emit = vi.fn();
      mockSocketValue = { emit };
      boardStore.getState().clearBoard();
      boardStore.getState().setActiveTool('sticky_note');
      render(<Board />);
      const stage = screen.getByTestId('canvas-board-stage');
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseUp(stage, { clientX: 100, clientY: 100, button: 0 });
      await act(flushMicrotasks);
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(emit).toHaveBeenCalledWith(
        'object:create',
        expect.objectContaining({
          object: expect.objectContaining({ type: 'sticky_note', id: expect.any(String) }),
        })
      );
      expect(screen.getByTestId(`object-sticky-${objects[0].id}`)).toBeInTheDocument();
    });

    it.each([
      ['rectangle', 'rectangle'],
      ['circle', 'circle'],
      ['line', 'line'],
    ] as const)('adds %s to store when socket is null', async (tool, expectedType) => {
      mockSocketValue = null;
      boardStore.getState().clearBoard();
      boardStore.getState().setActiveTool(tool);
      render(<Board />);
      const stage = screen.getByTestId('canvas-board-stage');
      fireEvent.mouseDown(stage, { clientX: 50, clientY: 50, button: 0 });
      fireEvent.mouseUp(stage, { clientX: 50, clientY: 50, button: 0 });
      await act(flushMicrotasks);
      const objects = boardStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0]).toMatchObject({ type: expectedType });
      expect(screen.getByTestId(`object-${expectedType}-${objects[0].id}`)).toBeInTheDocument();
    });
  });
});
