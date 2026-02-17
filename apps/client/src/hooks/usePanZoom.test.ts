import { describe, it, expect } from 'vitest';
import { clampScale, zoomTowardPoint, type IStagePosition } from './usePanZoom';

describe('usePanZoom zoom math', () => {
  describe('clampScale', () => {
    it('clamps scale to 0.1 minimum', () => {
      expect(clampScale(0.05)).toBe(0.1);
      expect(clampScale(0.1)).toBe(0.1);
    });

    it('clamps scale to 5 maximum', () => {
      expect(clampScale(10)).toBe(5);
      expect(clampScale(5)).toBe(5);
    });

    it('returns scale unchanged when within bounds', () => {
      expect(clampScale(1)).toBe(1);
      expect(clampScale(2.5)).toBe(2.5);
    });
  });

  describe('zoomTowardPoint', () => {
    it('zooming in moves stage so pointer stays over same content point', () => {
      const pointer = { x: 100, y: 100 };
      const stagePosition: IStagePosition = { x: 50, y: 50 };
      const oldScale = 1;
      const newScale = 2;
      const result = zoomTowardPoint(pointer, stagePosition, oldScale, newScale);
      const contentUnderPointer = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };
      expect(result.x).toBe(pointer.x - contentUnderPointer.x * newScale);
      expect(result.y).toBe(pointer.y - contentUnderPointer.y * newScale);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('returns new position for arbitrary pointer and scale', () => {
      const pointer = { x: 200, y: 150 };
      const stagePosition: IStagePosition = { x: 100, y: 50 };
      const oldScale = 1;
      const newScale = 0.5;
      const result = zoomTowardPoint(pointer, stagePosition, oldScale, newScale);
      expect(result.x).toBe(200 - 100 * 0.5);
      expect(result.y).toBe(150 - 100 * 0.5);
      expect(result.x).toBe(150);
      expect(result.y).toBe(100);
    });
  });
});
