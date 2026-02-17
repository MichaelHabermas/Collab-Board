import type { ReactElement } from 'react';
import { memo } from 'react';
import { Group, Circle } from 'react-konva';
import type { CircleShape as ICircleShape } from '@collab-board/shared-types';
import { boardStore } from '@/store/boardStore';

interface ICircleShapeProps {
  shape: ICircleShape;
  isSelected: boolean;
}

export const CircleShapeComponent = memo(function CircleShapeComponent({
  shape,
  isSelected,
}: ICircleShapeProps): ReactElement {
  const { id, x, y, radius, color, strokeColor, strokeWidth, fillOpacity } = shape;

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
      data-testid={`object-circle-${id}`}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      listening
    >
      <Circle
        radius={radius}
        fill={color}
        opacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening={false}
      />
      {isSelected && <Circle radius={radius} stroke='#2563eb' strokeWidth={2} listening={false} />}
    </Group>
  );
});
