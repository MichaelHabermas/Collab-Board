import type Konva from 'konva';
import type { BoardObject } from '@collab-board/shared-types';

export const MIN_RESIZE = 20;

export interface ICommitNodeTransformResult {
  id: string;
  delta: Record<string, number>;
}

/**
 * Applies transform-end state to a single Konva Group: resets scale/rotation on the
 * node and updates the first child shape dimensions. Intentionally does NOT set
 * node.width/node.height on the Group so the hit graph stays on the child shape only
 * (avoids extra rectangular hit region for circles and rotated rectangles).
 */
export function commitNodeTransform(
  node: Konva.Group,
  obj: BoardObject,
  w: number,
  h: number
): ICommitNodeTransformResult | null {
  const id = node.getAttr('objectId') as string | undefined;
  if (!id) {
    return null;
  }
  const rotation = node.rotation();
  node.scaleX(1);
  node.scaleY(1);
  node.rotation(0);

  const children = node.getChildren?.() ?? [];
  const child = children[0];
  const isCircle = obj.type === 'circle';

  if (child && 'width' in child && typeof (child as Konva.Shape).width === 'function') {
    (child as Konva.Shape).width(w);
    (child as Konva.Shape).height(h);
  }
  const childEllipse = child as Konva.Shape & {
    radiusX?: (r: number) => number;
    radiusY?: (r: number) => number;
  };
  if (
    isCircle &&
    childEllipse &&
    typeof childEllipse.radiusX === 'function' &&
    typeof childEllipse.radiusY === 'function'
  ) {
    childEllipse.radiusX(w / 2);
    childEllipse.radiusY(h / 2);
  }

  const delta: Record<string, number> = {
    width: w,
    height: h,
    x: node.x(),
    y: node.y(),
    rotation,
  };
  if (isCircle) {
    delta.radius = Math.max(MIN_RESIZE / 2, Math.min(w, h) / 2);
  }
  return { id, delta };
}
