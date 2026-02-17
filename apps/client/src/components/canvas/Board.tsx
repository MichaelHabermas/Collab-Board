import type { ReactElement } from 'react';
import { useRef, useCallback, useState, useEffect } from 'react';
import type Konva from 'konva';
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import { useViewportSize } from '@/hooks/useViewportSize';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useCursorEmit } from '@/hooks/useCursorEmit';
import { useSocket } from '@/hooks/useSocket';
import { useObjectSync } from '@/hooks/useObjectSync';
import { CursorOverlay } from './CursorOverlay';
import { GridBackground } from './GridBackground';
import { BoardObjectsLayer } from '@/components/objects/BoardObjectsLayer';
import { StickyNoteTextEdit } from '@/components/objects/StickyNoteTextEdit';
import { boardStore, useObject, useSelectedObjectIds } from '@/store/boardStore';
import { authStore } from '@/store/authStore';
import {
  createStickyNote,
  createRectangle,
  createCircle,
  createLine,
} from '@/lib/create-board-object';
import type { StickyNote } from '@collab-board/shared-types';

/**
 * Konva Stage with four layers: grid (bottom), objects, selection, cursor (top).
 * Pan via drag; zoom via wheel toward cursor. Resizes when the window is resized.
 */
const MIN_RESIZE = 20;

export const Board = (): ReactElement => {
  const { width, height } = useViewportSize();
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const editingSticky = useObject(editingStickyId ?? '') as StickyNote | undefined;
  const selectedIds = useSelectedObjectIds();
  const nodeRefsMapRef = useRef<Map<string, Konva.Group>>(new Map());
  const [refsVersion, setRefsVersion] = useState(0);
  const transformerRef = useRef<Konva.Transformer>(null);
  const {
    stagePosition,
    stageScale,
    handleWheel,
    handleStageDragEnd,
    handleTouchStart,
    handleTouchMove,
    containerRef,
  } = usePanZoom();
  const gridRef = useRef<Konva.Layer>(null);
  const cursorRef = useRef<Konva.Layer>(null);
  const selectionRef = useRef<Konva.Layer>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const handleCursorMove = useCursorEmit();
  const { socket } = useSocket();
  useObjectSync();

  const registerNodeRef = useCallback((id: string, node: unknown) => {
    const group = node as Konva.Group | null;
    if (group) {
      group.setAttr('objectId', id);
      nodeRefsMapRef.current.set(id, group);
    } else {
      nodeRefsMapRef.current.delete(id);
    }
    setRefsVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const nodes = selectedIds
      .map((id) => nodeRefsMapRef.current.get(id))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
  }, [selectedIds, refsVersion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const ids = boardStore.getState().selectedObjectIds;
      if (ids.length === 0) return;
      e.preventDefault();
      for (const id of ids) {
        boardStore.getState().removeObject(id);
      }
      boardStore.getState().deselectAll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTransformEnd = useCallback(() => {
    const nodes = selectedIds
      .map((id) => nodeRefsMapRef.current.get(id))
      .filter(Boolean) as Konva.Node[];
    for (const node of nodes) {
      const id = node.getAttr('objectId') as string | undefined;
      if (!id) continue;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const w = Math.max(MIN_RESIZE, (node.width() ?? 0) * scaleX);
      const h = Math.max(MIN_RESIZE, (node.height() ?? 0) * scaleY);
      node.scaleX(1);
      node.scaleY(1);
      node.width(w);
      node.height(h);
      const children = (node as Konva.Group).getChildren?.() ?? [];
      const child = children[0];
      if (child && 'width' in child && typeof (child as Konva.Shape).width === 'function') {
        (child as Konva.Shape).width(w);
        (child as Konva.Shape).height(h);
      }
      boardStore.getState().updateObject(id, { width: w, height: h, x: node.x(), y: node.y() });
    }
  }, [selectedIds]);

  const handleStageMouseDown = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
        getType?: () => string;
      };
    }) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      dragStartRef.current = { x: pos.x, y: pos.y };
      const isEmptyArea = (e.target as unknown) === stage || e.target.getType?.() === 'Layer';
      const tool = boardStore.getState().activeToolType;
      if (isEmptyArea && tool === 'select') {
        const boardX = (pos.x - stagePosition.x) / stageScale;
        const boardY = (pos.y - stagePosition.y) / stageScale;
        selectionStartRef.current = { x: boardX, y: boardY };
        setSelectionRect({ x: boardX, y: boardY, width: 0, height: 0 });
      }
    },
    [stagePosition, stageScale]
  );

  const handleStageMouseMove = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
      };
    }) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const boardX = (pos.x - stagePosition.x) / stageScale;
      const boardY = (pos.y - stagePosition.y) / stageScale;
      handleCursorMove(boardX, boardY);
      if (selectionRect === null || !selectionStartRef.current) return;
      const start = selectionStartRef.current;
      const x = Math.min(start.x, boardX);
      const y = Math.min(start.y, boardY);
      const width = Math.abs(boardX - start.x);
      const height = Math.abs(boardY - start.y);
      setSelectionRect({ x, y, width, height });
    },
    [handleCursorMove, selectionRect, stagePosition, stageScale]
  );

  const handleStageMouseUp = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
        getType?: () => string;
      };
    }) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const isEmptyArea = (e.target as unknown) === stage || e.target.getType?.() === 'Layer';
      if (!isEmptyArea) return;
      const tool = boardStore.getState().activeToolType;
      if (selectionRect !== null) {
        const objects = boardStore.getState().objects;
        const ids = objects
          .filter((obj) => {
            const r = selectionRect;
            const right = r.x + r.width;
            const bottom = r.y + r.height;
            const objW = Math.max(obj.width, 1);
            const objH = Math.max(obj.height, 1);
            const objRight = obj.x + objW;
            const objBottom = obj.y + objH;
            return !(obj.x > right || objRight < r.x || obj.y > bottom || objBottom < r.y);
          })
          .map((o) => o.id);
        boardStore.getState().setSelectedObjectIds(ids);
        setSelectionRect(null);
        selectionStartRef.current = null;
        return;
      }
      if (tool === 'select') {
        boardStore.getState().deselectAll();
        return;
      }
      const pos = stage.getPointerPosition();
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!pos || !start) return;
      const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
      if (dist > 5) return;
      const pointer = stagePosition;
      const scale = stageScale;
      const boardX = (pos.x - pointer.x) / scale;
      const boardY = (pos.y - pointer.y) / scale;
      const boardId = boardStore.getState().boardId || 'default-board';
      const createdBy = authStore.getState().userId || 'anonymous';
      if (!socket) return;
      const emitCreate = (
        obj:
          | StickyNote
          | ReturnType<typeof createRectangle>
          | ReturnType<typeof createCircle>
          | ReturnType<typeof createLine>
      ): void => {
        const object = Object.fromEntries(
          Object.entries(obj).filter(([k]) => k !== 'id' && k !== 'updatedAt')
        ) as Omit<typeof obj, 'id' | 'updatedAt'>;
        socket.emit('object:create', { boardId, object });
      };
      if (tool === 'sticky_note') {
        const sticky = createStickyNote(boardId, boardX, boardY, createdBy);
        emitCreate(sticky);
      } else if (tool === 'rectangle') {
        const rect = createRectangle(boardId, boardX, boardY, createdBy);
        emitCreate(rect);
      } else if (tool === 'circle') {
        const circle = createCircle(boardId, boardX, boardY, createdBy);
        emitCreate(circle);
      } else if (tool === 'line') {
        const line = createLine(boardId, boardX, boardY, createdBy);
        emitCreate(line);
      }
    },
    [stagePosition, stageScale, selectionRect, socket]
  );

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ width, height, overflow: 'hidden', position: 'relative' }}
      data-testid='canvas-board-container'
    >
      {editingSticky && (
        <div className='pointer-events-none absolute inset-0' style={{ zIndex: 10 }}>
          <div className='pointer-events-auto'>
            <StickyNoteTextEdit
              sticky={editingSticky}
              stageX={stagePosition.x}
              stageY={stagePosition.y}
              scale={stageScale}
              onClose={() => setEditingStickyId(null)}
            />
          </div>
        </div>
      )}
      <Stage
        data-testid='canvas-board-stage'
        width={width}
        height={height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable
        onDragEnd={handleStageDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{ display: 'block' }}
      >
        <Layer ref={gridRef} data-testid='canvas-board-layer-grid' name='grid' listening={false}>
          <GridBackground />
        </Layer>
        <BoardObjectsLayer
          onStickyDoubleClick={(id) => setEditingStickyId(id)}
          registerNodeRef={registerNodeRef}
        />
        <Layer ref={selectionRef} data-testid='canvas-board-layer-selection' name='selection'>
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              stroke='#2563eb'
              strokeWidth={2}
              fill='rgba(37, 99, 235, 0.1)'
              listening={false}
            />
          )}
          <Transformer ref={transformerRef} onTransformEnd={handleTransformEnd} />
        </Layer>
        <Layer ref={cursorRef} data-testid='canvas-board-layer-cursor' name='cursor'>
          <CursorOverlay stageScale={stageScale} />
        </Layer>
      </Stage>
    </div>
  );
};
