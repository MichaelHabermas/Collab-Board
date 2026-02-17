import type { ReactElement } from 'react';
import { memo } from 'react';
import { Group, Rect } from 'react-konva';
import type { RectangleShape as IRectangleShape } from '@collab-board/shared-types';
import { boardStore } from '@/store/boardStore';

interface IRectangleShapeProps {
  shape: IRectangleShape;
  isSelected: boolean;
}

export const RectangleShapeComponent = memo(function RectangleShapeComponent({
  shape,
  isSelected,
}: IRectangleShapeProps): ReactElement {
  const { id, x, y, width, height, color, strokeColor, strokeWidth, fillOpacity } = shape;

  const handleClick = (): void => {
    boardStore.getState().selectObject(id);
  };

  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }): void => {
    boardStore.getState().updateObject(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Group
      data-testid={`object-rectangle-${id}`}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
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
        listening={false}
      />
      {isSelected && (
        <Rect width={width} height={height} stroke='#2563eb' strokeWidth={2} listening={false} />
      )}
    </Group>
  );
});
