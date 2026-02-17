import type { ReactElement } from 'react';
import { useRef, useCallback, useState, useEffect } from 'react';
import type Konva from 'konva';
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import { useContainerSize } from '@/hooks/useContainerSize';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useCursorEmit } from '@/hooks/useCursorEmit';
import { useSocket } from '@/hooks/useSocket';
import { useObjectSync } from '@/hooks/useObjectSync';
import { CursorOverlay } from './CursorOverlay';
import { GridBackground } from './GridBackground';
import { BoardObjectsLayer } from '@/components/objects/BoardObjectsLayer';
import { StickyNoteTextEdit } from '@/components/objects/StickyNoteTextEdit';
import {
  boardStore,
  useObject,
  useSelectedObjectIds,
  useActiveToolType,
  useAllObjects,
} from '@/store/boardStore';
import { authStore } from '@/store/authStore';
import { executeObjectCreation } from '@/lib/execute-object-creation';
import type { StickyNote } from '@collab-board/shared-types';

/**
 * Konva Stage with four layers: grid (bottom), selection, objects, cursor (top).
 * Objects layer must stay above selection layer so object hit-test and drag receive events first.
 * Pan via drag; zoom via wheel toward cursor. Resizes when the window is resized.
 */
const MIN_RESIZE = 20;
const EDGE_PAN_MARGIN = 50;
const EDGE_PAN_SPEED = 12;

export const Board = (): ReactElement => {
  const {
    stagePosition,
    stageScale,
    setStagePosition,
    handleWheel,
    handleStageDragEnd,
    handleTouchStart,
    handleTouchMove,
    containerRef,
  } = usePanZoom();
  const activeToolType = useActiveToolType();
  const objects = useAllObjects();
  const { width, height } = useContainerSize(containerRef);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const editingSticky = useObject(editingStickyId ?? '') as StickyNote | undefined;
  const selectedIds = useSelectedObjectIds();
  const nodeRefsMapRef = useRef<Map<string, Konva.Group>>(new Map());
  const [refsVersion, setRefsVersion] = useState(0);
  const transformerRef = useRef<Konva.Transformer>(null);
  const gridRef = useRef<Konva.Layer>(null);
  const cursorRef = useRef<Konva.Layer>(null);
  const selectionRef = useRef<Konva.Layer>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const middlePanStartRef = useRef<{
    pointer: { x: number; y: number };
    stagePosition: { x: number; y: number };
  } | null>(null);
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
      const existing = nodeRefsMapRef.current.get(id);
      if (existing === group) {
        return;
      }
      group.setAttr('objectId', id);
      nodeRefsMapRef.current.set(id, group);
    } else {
      if (!nodeRefsMapRef.current.has(id)) {
        return;
      }
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
      const boardId = boardStore.getState().boardId;
      for (const id of ids) {
        boardStore.getState().removeObject(id);
        if (socket && boardId) {
          socket.emit('object:delete', { boardId, objectId: id });
        }
      }
      boardStore.getState().deselectAll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket]);

  const handleTransformEnd = useCallback(() => {
    const boardId = boardStore.getState().boardId;
    const objects = boardStore.getState().objects;
    const nodes = selectedIds
      .map((id) => nodeRefsMapRef.current.get(id))
      .filter(Boolean) as Konva.Node[];
    for (const node of nodes) {
      const id = node.getAttr('objectId') as string | undefined;
      if (!id) continue;
      const obj = objects.find((o) => o.id === id);
      if (!obj) continue;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      const baseW = Math.max(1, obj.width);
      const baseH = Math.max(1, obj.height);
      const w = Math.max(MIN_RESIZE, baseW * scaleX);
      const h = Math.max(MIN_RESIZE, baseH * scaleY);
      node.scaleX(1);
      node.scaleY(1);
      node.rotation(0);
      node.width(w);
      node.height(h);
      const children = (node as Konva.Group).getChildren?.() ?? [];
      const child = children[0];
      const isCircle = obj.type === 'circle';

      if (child && 'width' in child && typeof (child as Konva.Shape).width === 'function') {
        (child as Konva.Shape).width(w);
        (child as Konva.Shape).height(h);
      }
      const childEllipse = child as Konva.Shape & {
        radiusX?: (r: number) => number;
        radiusY?: (r: number) => number;
      };
      if (
        isCircle &&
        childEllipse &&
        typeof childEllipse.radiusX === 'function' &&
        typeof childEllipse.radiusY === 'function'
      ) {
        childEllipse.radiusX(w / 2);
        childEllipse.radiusY(h / 2);
      }

      const delta: Record<string, number> = {
        width: w,
        height: h,
        x: node.x(),
        y: node.y(),
        rotation,
      };
      if (isCircle) {
        delta.radius = Math.max(MIN_RESIZE / 2, Math.min(w, h) / 2);
      }
      boardStore.getState().updateObject(id, delta);
      if (socket && boardId) {
        socket.emit('object:update', { boardId, objectId: id, delta });
      }
    }
  }, [selectedIds, socket]);

  const handleStageMouseDown = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
        getType?: () => string;
      };
      evt?: MouseEvent;
    }) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const button = e.evt?.button ?? 0;
      const targetType = e.target.getType?.();
      const isEmptyArea =
        (e.target as unknown) === stage || targetType === 'Layer' || targetType === 'Stage';
      const tool = boardStore.getState().activeToolType;

      if (button === 1) {
        middlePanStartRef.current = {
          pointer: { x: pos.x, y: pos.y },
          stagePosition: { ...stagePosition },
        };
        return;
      }

      if (button !== 0) return;

      dragStartRef.current = { x: pos.x, y: pos.y };
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

      if (middlePanStartRef.current) {
        const start = middlePanStartRef.current;
        const dx = pos.x - start.pointer.x;
        const dy = pos.y - start.pointer.y;
        setStagePosition({
          x: start.stagePosition.x + dx,
          y: start.stagePosition.y + dy,
        });
        return;
      }

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
    [handleCursorMove, selectionRect, stagePosition, stageScale, setStagePosition]
  );

  const handleStageMouseUp = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
        getType?: () => string;
      };
      evt?: MouseEvent;
    }) => {
      const button = e.evt?.button ?? 0;
      if (button === 1) {
        middlePanStartRef.current = null;
        return;
      }
      if (button !== 0) return;

      const stage = e.target.getStage();
      if (!stage) return;

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

      const targetType = e.target.getType?.();
      const isEmptyArea =
        (e.target as unknown) === stage || targetType === 'Layer' || targetType === 'Stage';
      if (!isEmptyArea) return;
      const tool = boardStore.getState().activeToolType;
      if (tool === 'select') {
        boardStore.getState().deselectAll();
        return;
      }
      const pos = stage.getPointerPosition();
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!pos || !start) return;
      const pointer = stagePosition;
      const scale = stageScale;
      // Use mousedown position so creation works even if user drags slightly
      const boardX = (start.x - pointer.x) / scale;
      const boardY = (start.y - pointer.y) / scale;
      const boardId = boardStore.getState().boardId || 'default-board';
      const createdBy = authStore.getState().userId || 'anonymous';
      executeObjectCreation(socket, tool, boardId, boardX, boardY, createdBy);
    },
    [stagePosition, stageScale, selectionRect, socket]
  );

  const handleStageMouseLeave = useCallback(() => {
    middlePanStartRef.current = null;
  }, []);

  const handleStageDragEndOnlyWhenStage = useCallback(
    (e: { target: { getStage: () => { x: () => number; y: () => number } | null; x: () => number; y: () => number } }) => {
      const stage = e.target.getStage();
      if (stage && e.target === stage) {
        handleStageDragEnd(e);
      }
    },
    [handleStageDragEnd]
  );

  const handleStageDragMove = useCallback(
    (e: {
      target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null };
    }) => {
      const stage = e.target.getStage();
      if (!stage || (e.target as unknown) === stage) {
        return;
      }
      const pos = stage.getPointerPosition();
      if (!pos || !width || !height) {
        return;
      }
      const w = width;
      const h = height;
      let dx = 0;
      let dy = 0;
      if (pos.x < EDGE_PAN_MARGIN) {
        dx = EDGE_PAN_SPEED * (1 - pos.x / EDGE_PAN_MARGIN);
      } else if (pos.x > w - EDGE_PAN_MARGIN) {
        dx = -EDGE_PAN_SPEED * (1 - (w - pos.x) / EDGE_PAN_MARGIN);
      }
      if (pos.y < EDGE_PAN_MARGIN) {
        dy = EDGE_PAN_SPEED * (1 - pos.y / EDGE_PAN_MARGIN);
      } else if (pos.y > h - EDGE_PAN_MARGIN) {
        dy = -EDGE_PAN_SPEED * (1 - (h - pos.y) / EDGE_PAN_MARGIN);
      }
      if (dx !== 0 || dy !== 0) {
        setStagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    },
    [width, height, setStagePosition]
  );

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      data-testid='canvas-board-container'
      data-object-count={objects.length}
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
        width={width || 1}
        height={height || 1}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={activeToolType === 'pan'}
        onDragEnd={handleStageDragEndOnlyWhenStage}
        onDragMove={handleStageDragMove}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseLeave}
        onContextMenu={(e) => e.evt?.preventDefault()}
        style={{ display: 'block' }}
      >
        <Layer ref={gridRef} data-testid='canvas-board-layer-grid' name='grid' listening={false}>
          <GridBackground
            viewportWidth={width || 1}
            viewportHeight={height || 1}
            stagePosition={stagePosition}
            stageScale={stageScale}
          />
        </Layer>
        <Layer ref={selectionRef} data-testid='canvas-board-layer-selection' name='selection'>
          {selectionRect && (
              <Rect
              data-testid='canvas-selection-rect'
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
          <Transformer
            ref={transformerRef}
            onTransformEnd={handleTransformEnd}
            shouldOverdrawWholeArea={false}
          />
        </Layer>
        <BoardObjectsLayer
          onStickyDoubleClick={(id) => setEditingStickyId(id)}
          registerNodeRef={registerNodeRef}
        />
        <Layer
          ref={cursorRef}
          data-testid='canvas-board-layer-cursor'
          name='cursor'
          listening={false}
        >
          <CursorOverlay stageScale={stageScale} />
        </Layer>
      </Stage>
    </div>
  );
};
