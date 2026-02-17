import type { ReactElement } from 'react';
import { Stage, Layer } from 'react-konva';
import { useViewportSize } from '@/hooks/useViewportSize';

/**
 * Konva Stage with a single Layer filling the viewport.
 * Resizes when the window is resized.
 */
export const Board = (): ReactElement => {
  const { width, height } = useViewportSize();

  return (
    <Stage
      data-testid='canvas-board-stage'
      width={width}
      height={height}
      style={{ display: 'block' }}
    >
      <Layer data-testid='canvas-board-layer-default' />
    </Stage>
  );
};
