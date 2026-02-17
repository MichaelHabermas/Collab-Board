import { useState, useCallback, useRef, useEffect } from 'react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_BY = 1.08;

export interface IStagePosition {
  x: number;
  y: number;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Pan and zoom state for Konva Stage. Pan via drag; zoom via wheel toward cursor; pinch for touch.
 * Scale clamped 10%–500% (0.1–5.0). Use with Stage position/scale and onDragEnd/onWheel/onTouchMove.
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
  const [stageScale, setStageScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef(stagePosition);
  const lastScaleRef = useRef(stageScale);
  useEffect(() => {
    lastPositionRef.current = stagePosition;
    lastScaleRef.current = stageScale;
  }, [stagePosition, stageScale]);

  const pinchStartRef = useRef<{
    distance: number;
    center: { x: number; y: number };
  } | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const direction = e.deltaY > 0 ? 1 : -1;
      const scaleFactor = direction > 0 ? 1 / SCALE_BY : SCALE_BY;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, stageScale * scaleFactor));
      const contentX = (pointer.x - stagePosition.x) / stageScale;
      const contentY = (pointer.y - stagePosition.y) / stageScale;
      setStagePosition({
        x: pointer.x - contentX * newScale,
        y: pointer.y - contentY * newScale,
      });
      setStageScale(newScale);
    },
    [stagePosition, stageScale]
  );

  const handleStageDragEnd = useCallback((e: { target: { x: () => number; y: () => number } }) => {
    setStagePosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  const getTouchPoint = useCallback((touch: React.Touch, rect: DOMRect) => {
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 2) {
        pinchStartRef.current = null;
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const a = getTouchPoint(e.touches[0], rect);
      const b = getTouchPoint(e.touches[1], rect);
      pinchStartRef.current = {
        distance: distance(a, b),
        center: midpoint(a, b),
      };
    },
    [getTouchPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 2 || !pinchStartRef.current) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const a = getTouchPoint(e.touches[0], rect);
      const b = getTouchPoint(e.touches[1], rect);
      const newDistance = distance(a, b);
      const center = midpoint(a, b);
      const scaleRatio = newDistance / pinchStartRef.current.distance;
      const pos = lastPositionRef.current;
      const scale = lastScaleRef.current;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * scaleRatio));
      const newPos = zoomTowardPoint(center, pos, scale, newScale);
      setStagePosition(newPos);
      setStageScale(newScale);
      pinchStartRef.current = { distance: newDistance, center };
    },
    [getTouchPoint]
  );

  return {
    stagePosition,
    stageScale,
    handleWheel,
    handleStageDragEnd,
    handleTouchStart,
    handleTouchMove,
    containerRef,
  };
}

/** Clamp scale for tests and reuse. */
export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
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
