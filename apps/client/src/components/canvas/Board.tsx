import type { ReactElement } from 'react';
import { useRef } from 'react';
import type Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useViewportSize } from '@/hooks/useViewportSize';

/**
 * Konva Stage with four layers: grid (bottom), objects, selection, cursor (top).
 * Resizes when the window is resized. Layer refs are exposed for direct updates (e.g. cursors at 60fps).
 */
export const Board = (): ReactElement => {
  const { width, height } = useViewportSize();
  const gridRef = useRef<Konva.Layer>(null);
  const objectsRef = useRef<Konva.Layer>(null);
  const cursorRef = useRef<Konva.Layer>(null);
  const selectionRef = useRef<Konva.Layer>(null);

  return (
    <Stage
      data-testid='canvas-board-stage'
      width={width}
      height={height}
      style={{ display: 'block' }}
    >
      <Layer ref={gridRef} data-testid='canvas-board-layer-grid' name='grid' />
      <Layer ref={objectsRef} data-testid='canvas-board-layer-objects' name='objects' />
      <Layer ref={selectionRef} data-testid='canvas-board-layer-selection' name='selection' />
      <Layer ref={cursorRef} data-testid='canvas-board-layer-cursor' name='cursor' />
    </Stage>
  );
};
