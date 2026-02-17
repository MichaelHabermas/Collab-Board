import { useState, useCallback, useRef } from 'react';

export interface IStagePosition {
  x: number;
  y: number;
}

/**
 * Pan state for Konva Stage. Pan via drag; position updates on drag end.
 */
export function usePanZoom(): {
  stagePosition: IStagePosition;
  stageScale: number;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  handleStageDragEnd: (e: { target: { x: () => number; y: () => number } }) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
} {
  const [stagePosition, setStagePosition] = useState<IStagePosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStageDragEnd = useCallback((e: { target: { x: () => number; y: () => number } }) => {
    setStagePosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  return {
    stagePosition,
    stageScale: 1,
    handleWheel: () => {},
    handleStageDragEnd,
    handleTouchStart: () => {},
    handleTouchMove: () => {},
    containerRef,
  };
}

/** Clamp scale for tests and reuse. */
export function clampScale(scale: number): number {
  const MIN = 0.1;
  const MAX = 5;
  return Math.min(MAX, Math.max(MIN, scale));
}

/** Compute new position so that content point stays under pointer after scale change. */
export function zoomTowardPoint(
  pointer: { x: number; y: number },
  stagePosition: IStagePosition,
  oldScale: number,
  newScale: number
): IStagePosition {
  const contentX = (pointer.x - stagePosition.x) / oldScale;
  const contentY = (pointer.y - stagePosition.y) / oldScale;
  return {
    x: pointer.x - contentX * newScale,
    y: pointer.y - contentY * newScale,
  };
}
