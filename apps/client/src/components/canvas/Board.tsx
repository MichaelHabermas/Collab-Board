import type { ReactElement } from 'react';
import { useRef } from 'react';
import type Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useViewportSize } from '@/hooks/useViewportSize';
import { usePanZoom } from '@/hooks/usePanZoom';

/**
 * Konva Stage with four layers: grid (bottom), objects, selection, cursor (top).
 * Pan via drag; zoom via wheel toward cursor. Resizes when the window is resized.
 */
export const Board = (): ReactElement => {
  const { width, height } = useViewportSize();
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
  const objectsRef = useRef<Konva.Layer>(null);
  const cursorRef = useRef<Konva.Layer>(null);
  const selectionRef = useRef<Konva.Layer>(null);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ width, height, overflow: 'hidden' }}
      data-testid='canvas-board-container'
    >
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
        style={{ display: 'block' }}
      >
        <Layer ref={gridRef} data-testid='canvas-board-layer-grid' name='grid' />
        <Layer ref={objectsRef} data-testid='canvas-board-layer-objects' name='objects' />
        <Layer ref={selectionRef} data-testid='canvas-board-layer-selection' name='selection' />
        <Layer ref={cursorRef} data-testid='canvas-board-layer-cursor' name='cursor' />
      </Stage>
    </div>
  );
};
