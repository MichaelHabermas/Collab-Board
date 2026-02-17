import { MIN_RESIZE } from '@/lib/commit-node-transform';

/** Minimum length for a line created by drag (same as MIN_RESIZE for consistency). */
export const MIN_LINE_LENGTH = MIN_RESIZE;

/** Normalized box geometry for rectangle/circle/sticky creation. */
export interface IBoxCreationGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Line creation: start (x,y) and vector (dx, dy) with length. */
export interface ILineCreationGeometry {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
}

/**
 * Computes box geometry from drag start/end in board coordinates.
 * Ensures width and height are at least MIN_RESIZE (clamps small drags).
 */
export function computeBoxCreationGeometry(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): IBoxCreationGeometry {
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  const clampedWidth = Math.max(MIN_RESIZE, width);
  const clampedHeight = Math.max(MIN_RESIZE, height);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  return {
    x,
    y,
    width: clampedWidth,
    height: clampedHeight,
  };
}

/**
 * Computes line geometry from drag start (mouse down) to end (mouse up).
 * If length is below MIN_LINE_LENGTH, scales the vector to that length.
 * Zero-length drag (click without move) yields a horizontal segment of MIN_LINE_LENGTH.
 */
export function computeLineCreationGeometry(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): ILineCreationGeometry {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const clampedLength = Math.max(MIN_LINE_LENGTH, length);
  let finalDx: number;
  let finalDy: number;
  if (length > 0) {
    const scale = clampedLength / length;
    finalDx = dx * scale;
    finalDy = dy * scale;
  } else {
    finalDx = clampedLength;
    finalDy = 0;
  }
  const finalLength = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
  return {
    x: startX,
    y: startY,
    dx: finalDx,
    dy: finalDy,
    length: finalLength,
  };
}
