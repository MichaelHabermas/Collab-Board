import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Group, Line } from 'react-konva';

const GRID_SIZE = 24;
const STROKE = '#e5e7eb';
const OVERFLOW_MARGIN = 2 * GRID_SIZE;

export interface IStagePosition {
  x: number;
  y: number;
}

export interface IGridViewportProps {
  viewportWidth: number;
  viewportHeight: number;
  stagePosition: IStagePosition;
  stageScale: number;
}

export interface IGridPoints {
  horizontalPoints: number[];
  verticalPoints: number[];
}

/**
 * Compute grid line points in content coordinates for the visible viewport.
 * Exported for unit tests (viewport-based extent and regression).
 */
export function computeGridPoints({
  viewportWidth,
  viewportHeight,
  stagePosition,
  stageScale,
}: IGridViewportProps): IGridPoints {
  const safeScale = Math.max(0.001, stageScale);
  const safeWidth = Math.max(0, viewportWidth);
  const safeHeight = Math.max(0, viewportHeight);

  const contentLeft = -stagePosition.x / safeScale;
  const contentTop = -stagePosition.y / safeScale;
  const contentRight = contentLeft + safeWidth / safeScale;
  const contentBottom = contentTop + safeHeight / safeScale;

  const xMin = Math.floor((contentLeft - OVERFLOW_MARGIN) / GRID_SIZE) * GRID_SIZE;
  const xMax = Math.ceil((contentRight + OVERFLOW_MARGIN) / GRID_SIZE) * GRID_SIZE;
  const yMin = Math.floor((contentTop - OVERFLOW_MARGIN) / GRID_SIZE) * GRID_SIZE;
  const yMax = Math.ceil((contentBottom + OVERFLOW_MARGIN) / GRID_SIZE) * GRID_SIZE;

  const hPoints: number[] = [];
  const vPoints: number[] = [];

  for (let y = yMin; y <= yMax; y += GRID_SIZE) {
    hPoints.push(xMin, y, xMax, y);
  }
  for (let x = xMin; x <= xMax; x += GRID_SIZE) {
    vPoints.push(x, yMin, x, yMax);
  }

  return { horizontalPoints: hPoints, verticalPoints: vPoints };
}

/**
 * Viewport-based grid: only draws lines that intersect the visible area (in content
 * coordinates) plus a small overflow. The board is effectively infinite; no fixed extent.
 * Drawn in stage content coordinates; scales with zoom because the layer is a child of the Stage.
 */
export const GridBackground = ({
  viewportWidth,
  viewportHeight,
  stagePosition,
  stageScale,
}: IGridViewportProps): ReactElement => {
  const { horizontalPoints, verticalPoints } = useMemo(
    () =>
      computeGridPoints({
        viewportWidth,
        viewportHeight,
        stagePosition,
        stageScale,
      }),
    [viewportWidth, viewportHeight, stagePosition, stageScale]
  );

  const horizontalSegments = useMemo(() => {
    const segments: number[][] = [];
    for (let i = 0; i < horizontalPoints.length; i += 4) {
      segments.push(horizontalPoints.slice(i, i + 4));
    }
    return segments;
  }, [horizontalPoints]);

  const verticalSegments = useMemo(() => {
    const segments: number[][] = [];
    for (let i = 0; i < verticalPoints.length; i += 4) {
      segments.push(verticalPoints.slice(i, i + 4));
    }
    return segments;
  }, [verticalPoints]);

  return (
    <>
      <Group data-testid='canvas-grid-horizontal' listening={false}>
        {horizontalSegments.map((points, i) => (
          <Line key={`h-${i}`} points={points} stroke={STROKE} strokeWidth={1} listening={false} />
        ))}
      </Group>
      <Group data-testid='canvas-grid-vertical' listening={false}>
        {verticalSegments.map((points, i) => (
          <Line key={`v-${i}`} points={points} stroke={STROKE} strokeWidth={1} listening={false} />
        ))}
      </Group>
    </>
  );
};
