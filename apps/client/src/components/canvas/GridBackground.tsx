import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Line } from 'react-konva';

const GRID_SIZE = 24;
const GRID_EXTENT = 3000;
const STROKE = '#e5e7eb';

/**
 * Repeating grid of lines on the grid layer. Drawn in stage content coordinates;
 * scales with zoom because the layer is a child of the scaled Stage.
 */
export const GridBackground = (): ReactElement => {
  const { horizontalPoints, verticalPoints } = useMemo(() => {
    const hPoints: number[] = [];
    const vPoints: number[] = [];
    const min = -GRID_EXTENT;
    const max = GRID_EXTENT;
    for (let y = min; y <= max; y += GRID_SIZE) {
      hPoints.push(min, y, max, y);
    }
    for (let x = min; x <= max; x += GRID_SIZE) {
      vPoints.push(x, min, x, max);
    }
    return { horizontalPoints: hPoints, verticalPoints: vPoints };
  }, []);

  return (
    <>
      <Line
        data-testid='canvas-grid-horizontal'
        points={horizontalPoints}
        stroke={STROKE}
        strokeWidth={1}
        listening={false}
      />
      <Line
        data-testid='canvas-grid-vertical'
        points={verticalPoints}
        stroke={STROKE}
        strokeWidth={1}
        listening={false}
      />
    </>
  );
};
