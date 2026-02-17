import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Rect } from 'react-konva';
import type { RectangleShape as IRectangleShape } from '@collab-board/shared-types';
import { useDraggableBoardObject } from '@/hooks/useDraggableBoardObject';

interface IRectangleShapeProps {
  shape: IRectangleShape;
  isSelected: boolean;
  registerRef?: (node: Konva.Group | null) => void;
}

export const RectangleShapeComponent = memo(function RectangleShapeComponent({
  shape,
  isSelected,
  registerRef,
}: IRectangleShapeProps): ReactElement {
  const { id, x, y, width, height, rotation, color, strokeColor, strokeWidth, fillOpacity } = shape;
  const { draggable, handlePointerDown, handleClick, handleDragMove, handleDragEnd } =
    useDraggableBoardObject(id);

  return (
    <Group
      ref={registerRef}
      data-testid={`object-rectangle-${id}`}
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
      <Rect
        width={width}
        height={height}
        fill={color}
        opacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening
      />
      {isSelected && (
        <Rect width={width} height={height} stroke='#2563eb' strokeWidth={2} listening={false} />
      )}
    </Group>
  );
});
