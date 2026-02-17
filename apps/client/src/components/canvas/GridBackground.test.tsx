import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  GridBackground,
  computeGridPoints,
  type IGridViewportProps,
} from './GridBackground';

vi.mock('react-konva', () => ({
  Group: ({
    'data-testid': testId,
    children,
  }: {
    'data-testid'?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid={testId ?? 'canvas-grid-group-mock'}>{children}</div>
  ),
  Line: ({ 'data-testid': testId }: { 'data-testid'?: string }) =>
    testId != null ? <div data-testid={testId} /> : null,
}));

const defaultViewportProps: IGridViewportProps = {
  viewportWidth: 800,
  viewportHeight: 600,
  stagePosition: { x: 0, y: 0 },
  stageScale: 1,
};

describe('GridBackground', () => {
  it('renders horizontal and vertical grid line elements', () => {
    render(<GridBackground {...defaultViewportProps} />);
    expect(screen.getByTestId('canvas-grid-horizontal')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-grid-vertical')).toBeInTheDocument();
  });
});

describe('computeGridPoints', () => {
  it('returns segment format for uniform grid (regression: no polyline diagonals)', () => {
    const { horizontalPoints, verticalPoints } =
      computeGridPoints(defaultViewportProps);

    // Each horizontal segment is [xMin, y, xMax, y]: constant y (indices 1 and 3).
    for (let i = 0; i < horizontalPoints.length; i += 4) {
      const [, y1, , y2] = horizontalPoints.slice(i, i + 4);
      expect(y1).toBe(y2);
    }

    // Each vertical segment is [x, yMin, x, yMax]: constant x (indices 0 and 2).
    for (let i = 0; i < verticalPoints.length; i += 4) {
      const [x1, , x2] = verticalPoints.slice(i, i + 4);
      expect(x1).toBe(x2);
    }
  });

  it('returns points bounded by viewport (regression: no fixed 6000 extent)', () => {
    const { horizontalPoints, verticalPoints } =
      computeGridPoints(defaultViewportProps);

    const allCoords = [...horizontalPoints, ...verticalPoints];
    const maxAbs = Math.max(...allCoords.map((n) => Math.abs(n)));

    // Viewport 800x600 + overflow (2*24) => content range ~ -48 to 848 x -48 to 648.
    // Max coordinate should be on the order of viewport size, not the old fixed extent 3000.
    expect(maxAbs).toBeLessThan(1200);
    expect(maxAbs).toBeGreaterThan(0);

    // Point count should be O(visible lines), not the old 6000/24 * 2 full grid.
    const horizontalLineCount = horizontalPoints.length / 4;
    const verticalLineCount = verticalPoints.length / 4;
    const visibleY = 600 + 2 * 48;
    const visibleX = 800 + 2 * 48;
    expect(horizontalLineCount).toBeLessThanOrEqual(
      Math.ceil(visibleY / 24) + 2
    );
    expect(verticalLineCount).toBeLessThanOrEqual(
      Math.ceil(visibleX / 24) + 2
    );
  });

  it('extends grid into negative content coordinates when panned', () => {
    const props: IGridViewportProps = {
      viewportWidth: 800,
      viewportHeight: 600,
      stagePosition: { x: 400, y: 300 },
      stageScale: 1,
    };
    const { horizontalPoints, verticalPoints } = computeGridPoints(props);

    // Content left = -400, content top = -300; grid should include negative x and y.
    const hasNegativeX = verticalPoints.some((_, i) => i % 2 === 0 && verticalPoints[i] < 0);
    const hasNegativeY = horizontalPoints.some((_, i) => i % 2 === 1 && horizontalPoints[i] < 0);

    expect(hasNegativeX).toBe(true);
    expect(hasNegativeY).toBe(true);
  });

  it('handles zero viewport width without throwing', () => {
    const props: IGridViewportProps = {
      viewportWidth: 0,
      viewportHeight: 600,
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
    };
    expect(() => computeGridPoints(props)).not.toThrow();
    const result = computeGridPoints(props);
    expect(Array.isArray(result.horizontalPoints)).toBe(true);
    expect(Array.isArray(result.verticalPoints)).toBe(true);
  });

  it('handles zero viewport height without throwing', () => {
    const props: IGridViewportProps = {
      viewportWidth: 800,
      viewportHeight: 0,
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
    };
    expect(() => computeGridPoints(props)).not.toThrow();
    const result = computeGridPoints(props);
    expect(Array.isArray(result.horizontalPoints)).toBe(true);
    expect(Array.isArray(result.verticalPoints)).toBe(true);
  });

  it('handles zero scale without throwing and returns minimal lines', () => {
    const props: IGridViewportProps = {
      viewportWidth: 800,
      viewportHeight: 600,
      stagePosition: { x: 0, y: 0 },
      stageScale: 0,
    };
    expect(() => computeGridPoints(props)).not.toThrow();
    const result = computeGridPoints(props);
    // safeScale becomes 0.001; content size is huge but finite; we still get some lines.
    expect(Array.isArray(result.horizontalPoints)).toBe(true);
    expect(Array.isArray(result.verticalPoints)).toBe(true);
  });
});
