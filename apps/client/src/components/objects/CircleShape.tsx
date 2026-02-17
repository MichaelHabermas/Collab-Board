import type { ReactElement } from 'react';
import { memo, useCallback } from 'react';
import type Konva from 'konva';
import { Group, Ellipse } from 'react-konva';
import type { CircleShape as ICircleShape } from '@collab-board/shared-types';
import { useDraggableBoardObject } from '@/hooks/useDraggableBoardObject';

interface ICircleShapeProps {
  shape: ICircleShape;
  isSelected: boolean;
  registerRef?: (node: Konva.Group | null) => void;
}

export const CircleShapeComponent = memo(function CircleShapeComponent({
  shape,
  isSelected,
  registerRef,
}: ICircleShapeProps): ReactElement {
  const { id, x, y, rotation, width, height, color, strokeColor, strokeWidth, fillOpacity } = shape;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const { draggable, handlePointerDown, handleClick, handleDragMove, handleDragEnd } =
    useDraggableBoardObject(id);

  // hitFunc restricts hit detection to the ellipse path only (no bbox, no stroke area).
  // The Ellipse node centers at (0,0) in its local space, so we draw at (0,0) here.
  const hitFunc = useCallback((context: Konva.Context, node: Konva.Shape) => {
    const rx = node.width() / 2;
    const ry = node.height() / 2;
    context.beginPath();
    context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    context.closePath();
    context.fillShape(node);
  }, []);

  return (
    <Group
      ref={registerRef}
      data-testid={`object-circle-${id}`}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={handleClick}
      onTap={handleClick}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      listening
    >
      <Ellipse
        radiusX={radiusX}
        radiusY={radiusY}
        width={width}
        height={height}
        fill={color}
        opacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        hitFunc={hitFunc}
        hitStrokeWidth={0}
        listening
      />
      {isSelected && (
        <Ellipse
          radiusX={radiusX}
          radiusY={radiusY}
          stroke='#2563eb'
          strokeWidth={2}
          listening={false}
        />
      )}
    </Group>
  );
});
