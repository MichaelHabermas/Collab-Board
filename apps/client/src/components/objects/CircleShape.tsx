import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Circle } from 'react-konva';
import type { CircleShape as ICircleShape } from '@collab-board/shared-types';
import { boardStore, useActiveToolType } from '@/store/boardStore';

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
  const { id, x, y, radius, color, strokeColor, strokeWidth, fillOpacity } = shape;
  const activeToolType = useActiveToolType();
  const draggable = activeToolType === 'select';

  const handleClick = (e: { evt: MouseEvent | TouchEvent }): void => {
    const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
    if (shiftKey) {
      boardStore.getState().toggleSelection(id);
    } else {
      boardStore.getState().selectObject(id);
    }
  };

  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }): void => {
    boardStore.getState().updateObject(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Group
      ref={registerRef}
      data-testid={`object-circle-${id}`}
      x={x}
      y={y}
      draggable={draggable}
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
