import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Board } from './Board';
import { boardStore } from '@/store/boardStore';
import { createCircle, createStickyNote } from '@/lib/create-board-object';

const mockWidth = 800;
const mockHeight = 600;

const mockSetStagePosition = vi.fn();
const mockHandleStageDragEnd = vi.fn();

vi.mock('@/hooks/useContainerSize', () => ({
  useContainerSize: () => ({ width: mockWidth, height: mockHeight }),
}));

vi.mock('@/hooks/usePanZoom', () => ({
  usePanZoom: () => ({
    stagePosition: { x: 0, y: 0 },
    stageScale: 1,
    setStagePosition: mockSetStagePosition,
    handleWheel: vi.fn(),
    handleStageDragEnd: mockHandleStageDragEnd,
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
    const el = domEvt.target as HTMLElement | null;
    const isObject = el?.closest?.('[data-testid^="object-"]');
    return {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: domEvt.clientX, y: domEvt.clientY }),
        }),
        getType: () => (isObject ? 'Group' : 'Layer'),
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
      onMouseMove,
      onDragEnd,
      onDragMove: _onDragMove,
      children,
    }: {
      width: number;
      height: number;
      'data-testid'?: string;
      draggable?: boolean;
      onMouseDown?: (e: unknown) => void;
      onMouseUp?: (e: unknown) => void;
      onMouseMove?: (e: unknown) => void;
      onDragEnd?: (e: { target: { getStage: () => unknown; x: () => number; y: () => number } }) => void;
      onDragMove?: (e: unknown) => void;
      children: ReactNode;
    }) => {
      const stageStub = { x: () => 0, y: () => 0 };
      const groupTargetForBubble = {
        getStage: () => stageStub,
        x: () => 150,
        y: () => 150,
      };
      return (
        <div
          data-testid={testId ?? 'canvas-stage-mock'}
          data-width={width}
          data-height={height}
          data-draggable={String(draggable ?? false)}
          onMouseDown={(e: React.MouseEvent) => onMouseDown?.(makeKonvaMouseEvent(e.nativeEvent))}
          onMouseUp={(e: React.MouseEvent) => onMouseUp?.(makeKonvaMouseEvent(e.nativeEvent))}
          onMouseMove={(e: React.MouseEvent) => onMouseMove?.(makeKonvaMouseEvent(e.nativeEvent))}
        >
          {children}
          {onDragEnd && (
            <button
              type='button'
              data-testid='canvas-stage-simulate-bubbled-object-dragend'
              onClick={() => onDragEnd({ target: groupTargetForBubble })}
              aria-label='Simulate bubbled object drag end'
            />
          )}
        </div>
      );
    },
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
      onMouseDown,
      onTouchStart,
      onClick,
      onTap,
      onDragMove,
      onDragEnd,
    }: {
      'data-testid'?: string;
      children?: ReactNode;
      onMouseDown?: (e: unknown) => void;
      onTouchStart?: (e: unknown) => void;
      onClick?: (e: unknown) => void;
      onTap?: (e: unknown) => void;
      onDragMove?: (e: { target: { x: () => number; y: () => number } }) => void;
      onDragEnd?: (e: { target: { x: () => number; y: () => number } }) => void;
    }) => (
      <div
        data-testid={testId ?? 'canvas-group-mock'}
        onMouseDown={(e: React.MouseEvent) => {
          const konvaEvt = {
            ...makeKonvaMouseEvent(e.nativeEvent),
            evt: e.nativeEvent,
          };
          onMouseDown?.(konvaEvt);
        }}
        onTouchStart={(e: React.TouchEvent) => {
          const konvaEvt = {
            target: {
              getStage: () => ({
                getPointerPosition: () => ({ x: 0, y: 0 }),
              }),
              getType: () => 'Group',
            },
            evt: e.nativeEvent,
          };
          onTouchStart?.(konvaEvt);
        }}
        onClick={(e: React.MouseEvent) => {
          const konvaEvt = { ...makeKonvaMouseEvent(e.nativeEvent), evt: e.nativeEvent };
          onClick?.(konvaEvt);
          onTap?.(konvaEvt);
        }}
      >
        {children}
        {onDragMove && testId && (
          <button
            type='button'
            data-testid={`${testId}-simulate-dragmove`}
            onClick={() => onDragMove({ target: { x: () => 100, y: () => 100 } })}
            aria-label='Simulate drag move'
          />
        )}
        {onDragEnd && testId && (
          <button
            type='button'
            data-testid={`${testId}-simulate-dragend`}
            onClick={() => onDragEnd({ target: { x: () => 150, y: () => 150 } })}
            aria-label='Simulate drag end'
          />
        )}
      </div>
    ),
    Line: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
      testId ? <div data-testid={testId} /> : null,
    Circle: (): null => null,
    Ellipse: (): null => null,
    Shape: (): null => null,
    Transformer: (): null => null,
    Rect: (props: { 'data-testid'?: string }) =>
      props['data-testid'] ? <div data-testid={props['data-testid']} /> : null,
    Text: (): null => null,
  };
});

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleStageDragEnd.mockClear();
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

  describe('selector tool: selection and drag-move', () => {
    it('selects object on single pointer down when select tool is active', () => {
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      boardStore.getState().deselectAll();
      render(<Board />);
      const objectEl = screen.getByTestId(`object-sticky-${sticky.id}`);
      fireEvent.mouseDown(objectEl, { clientX: 10, clientY: 20, button: 0 });
      expect(boardStore.getState().selectedObjectIds).toEqual([sticky.id]);
    });

    it('updates store on drag move so object position stays in sync during drag', async () => {
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      render(<Board />);
      const simulateDragMove = screen.getByTestId(`object-sticky-${sticky.id}-simulate-dragmove`);
      await act(async () => {
        fireEvent.click(simulateDragMove);
      });
      const updated = boardStore.getState().objects.find((o) => o.id === sticky.id);
      expect(updated).toBeDefined();
      expect(updated?.x).toBe(100);
      expect(updated?.y).toBe(100);
    });

    it('select then drag sequence updates store and emits object:move (hit detection allows object to receive events)', async () => {
      const emit = vi.fn();
      mockSocketValue = { emit };
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      boardStore.getState().deselectAll();
      render(<Board />);
      const objectEl = screen.getByTestId(`object-sticky-${sticky.id}`);
      const simulateDragMove = screen.getByTestId(`object-sticky-${sticky.id}-simulate-dragmove`);
      const simulateDragEnd = screen.getByTestId(`object-sticky-${sticky.id}-simulate-dragend`);
      fireEvent.mouseDown(objectEl, { clientX: 10, clientY: 20, button: 0 });
      expect(boardStore.getState().selectedObjectIds).toEqual([sticky.id]);
      await act(async () => {
        fireEvent.click(simulateDragMove);
      });
      let updated = boardStore.getState().objects.find((o) => o.id === sticky.id);
      expect(updated?.x).toBe(100);
      expect(updated?.y).toBe(100);
      await act(async () => {
        fireEvent.click(simulateDragEnd);
      });
      updated = boardStore.getState().objects.find((o) => o.id === sticky.id);
      expect(updated).toBeDefined();
      expect(updated?.x).toBe(150);
      expect(updated?.y).toBe(150);
      expect(emit).toHaveBeenCalledWith('object:move', {
        boardId: 'test-board',
        objectId: sticky.id,
        x: 150,
        y: 150,
      });
    });

    it('clears selection when pointer down and up on empty area with select tool', () => {
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      boardStore.getState().selectObject(sticky.id);
      render(<Board />);
      const stage = screen.getByTestId('canvas-board-stage');
      fireEvent.mouseDown(stage, { clientX: 500, clientY: 500, button: 0 });
      fireEvent.mouseUp(stage, { clientX: 500, clientY: 500, button: 0 });
      expect(boardStore.getState().selectedObjectIds).toHaveLength(0);
    });

    it('clears marquee and selects intersecting objects when release is over an object', () => {
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      boardStore.getState().deselectAll();
      render(<Board />);
      const stage = screen.getByTestId('canvas-board-stage');
      const stickyEl = screen.getByTestId(`object-sticky-${sticky.id}`);
      fireEvent.mouseDown(stage, { clientX: 50, clientY: 50, button: 0 });
      fireEvent.mouseMove(stage, { clientX: 100, clientY: 80 });
      expect(screen.getByTestId('canvas-selection-rect')).toBeInTheDocument();
      fireEvent.mouseUp(stickyEl, { clientX: 100, clientY: 80, button: 0 });
      expect(boardStore.getState().selectedObjectIds).toContain(sticky.id);
      expect(screen.queryByTestId('canvas-selection-rect')).not.toBeInTheDocument();
    });

    it('toggles object in selection on shift+pointer down', () => {
      const sticky1 = createStickyNote('board', 0, 0, 'user');
      const sticky2 = createStickyNote('board', 100, 100, 'user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky1, sticky2]);
      boardStore.getState().setBoardMetadata('board', 'Test');
      boardStore.getState().setActiveTool('select');
      boardStore.getState().selectObject(sticky1.id);
      render(<Board />);
      const object2 = screen.getByTestId(`object-sticky-${sticky2.id}`);
      fireEvent.mouseDown(object2, { clientX: 100, clientY: 100, button: 0, shiftKey: true });
      expect(boardStore.getState().selectedObjectIds).toContain(sticky1.id);
      expect(boardStore.getState().selectedObjectIds).toContain(sticky2.id);
      fireEvent.mouseDown(object2, { clientX: 100, clientY: 100, button: 0, shiftKey: true });
      expect(boardStore.getState().selectedObjectIds).toEqual([sticky1.id]);
    });

    it('does not update stage position when object drag end bubbles to Stage (no view jump)', async () => {
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      render(<Board />);
      const simulateBubbledObjectDragEnd = screen.getByTestId(
        'canvas-stage-simulate-bubbled-object-dragend'
      );
      await act(async () => {
        fireEvent.click(simulateBubbledObjectDragEnd);
      });
      expect(mockHandleStageDragEnd).not.toHaveBeenCalled();
    });

    it('updates store and emits object:move when drag ends on object with select tool', async () => {
      const emit = vi.fn();
      mockSocketValue = { emit };
      const sticky = createStickyNote('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([sticky]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      render(<Board />);
      const simulateDragEnd = screen.getByTestId(`object-sticky-${sticky.id}-simulate-dragend`);
      await act(async () => {
        fireEvent.click(simulateDragEnd);
      });
      const updated = boardStore.getState().objects.find((o) => o.id === sticky.id);
      expect(updated).toBeDefined();
      expect(updated?.x).toBe(150);
      expect(updated?.y).toBe(150);
      expect(emit).toHaveBeenCalledWith('object:move', {
        boardId: 'test-board',
        objectId: sticky.id,
        x: 150,
        y: 150,
      });
    });

    it('updates store and emits object:move when drag ends on circle with select tool', async () => {
      const emit = vi.fn();
      mockSocketValue = { emit };
      const circle = createCircle('test-board', 10, 20, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([circle]);
      boardStore.getState().setBoardMetadata('test-board', 'Test');
      boardStore.getState().setActiveTool('select');
      render(<Board />);
      const simulateDragEnd = screen.getByTestId(`object-circle-${circle.id}-simulate-dragend`);
      await act(async () => {
        fireEvent.click(simulateDragEnd);
      });
      const updated = boardStore.getState().objects.find((o) => o.id === circle.id);
      expect(updated).toBeDefined();
      expect(updated?.x).toBe(150);
      expect(updated?.y).toBe(150);
      expect(emit).toHaveBeenCalledWith('object:move', {
        boardId: 'test-board',
        objectId: circle.id,
        x: 150,
        y: 150,
      });
    });

    it('circle resize: store update with radius keeps circle in sync', () => {
      const circle = createCircle('test-board', 0, 0, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([circle]);
      const w = 80;
      const h = 80;
      const newRadius = Math.min(w, h) / 2;
      const delta = {
        width: w,
        height: h,
        radius: newRadius,
        x: circle.x,
        y: circle.y,
        rotation: circle.rotation,
      };
      boardStore.getState().updateObject(circle.id, delta);
      const updated = boardStore.getState().objects.find((o) => o.id === circle.id);
      expect(updated).toBeDefined();
      expect(updated).toMatchObject({
        width: 80,
        height: 80,
        radius: 40,
      });
    });

    it('circle oval resize: store update with different width and height persists ellipse dimensions', () => {
      const circle = createCircle('test-board', 0, 0, 'test-user');
      boardStore.getState().clearBoard();
      boardStore.getState().setObjects([circle]);
      const w = 100;
      const h = 60;
      const delta = {
        width: w,
        height: h,
        radius: Math.min(w, h) / 2,
        x: circle.x,
        y: circle.y,
        rotation: circle.rotation,
      };
      boardStore.getState().updateObject(circle.id, delta);
      const updated = boardStore.getState().objects.find((o) => o.id === circle.id);
      expect(updated).toBeDefined();
      expect(updated?.type).toBe('circle');
      expect(updated?.width).toBe(100);
      expect(updated?.height).toBe(60);
      if (updated?.type === 'circle') {
        expect(updated.radius).toBe(30);
      }
    });
  });
});
