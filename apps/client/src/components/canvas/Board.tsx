import type { ReactElement } from 'react';
import { useRef, useCallback, useState } from 'react';
import type Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useViewportSize } from '@/hooks/useViewportSize';
import { usePanZoom } from '@/hooks/usePanZoom';
import { GridBackground } from './GridBackground';
import { BoardObjectsLayer } from '@/components/objects/BoardObjectsLayer';
import { StickyNoteTextEdit } from '@/components/objects/StickyNoteTextEdit';
import { boardStore, useObject } from '@/store/boardStore';
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
export const Board = (): ReactElement => {
  const { width, height } = useViewportSize();
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const editingSticky = useObject(editingStickyId ?? '') as StickyNote | undefined;
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

  const handleStageMouseDown = useCallback(
    (e: {
      target: {
        getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
      };
    }) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) dragStartRef.current = { x: pos.x, y: pos.y };
    },
    []
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
      if (tool === 'sticky_note') {
        const sticky = createStickyNote(boardId, boardX, boardY, createdBy);
        boardStore.getState().addObject(sticky);
      } else if (tool === 'rectangle') {
        const rect = createRectangle(boardId, boardX, boardY, createdBy);
        boardStore.getState().addObject(rect);
      } else if (tool === 'circle') {
        const circle = createCircle(boardId, boardX, boardY, createdBy);
        boardStore.getState().addObject(circle);
      } else if (tool === 'line') {
        const line = createLine(boardId, boardX, boardY, createdBy);
        boardStore.getState().addObject(line);
      }
    },
    [stagePosition, stageScale]
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
        onMouseUp={handleStageMouseUp}
        style={{ display: 'block' }}
      >
        <Layer ref={gridRef} data-testid='canvas-board-layer-grid' name='grid' listening={false}>
          <GridBackground />
        </Layer>
        <BoardObjectsLayer onStickyDoubleClick={(id) => setEditingStickyId(id)} />
        <Layer ref={selectionRef} data-testid='canvas-board-layer-selection' name='selection' />
        <Layer ref={cursorRef} data-testid='canvas-board-layer-cursor' name='cursor' />
      </Stage>
    </div>
  );
};
