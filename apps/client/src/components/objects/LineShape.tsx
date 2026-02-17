import type { ReactElement } from 'react';
import { memo } from 'react';
import { Group, Line } from 'react-konva';
import type { LineShape as ILineShape } from '@collab-board/shared-types';
import { boardStore } from '@/store/boardStore';

interface ILineShapeProps {
  shape: ILineShape;
  isSelected: boolean;
}

export const LineShapeComponent = memo(function LineShapeComponent({
  shape,
  isSelected,
}: ILineShapeProps): ReactElement {
  const { id, x, y, points, strokeColor, strokeWidth } = shape;

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
      data-testid={`object-line-${id}`}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      listening
    >
      <Line points={points} stroke={strokeColor} strokeWidth={strokeWidth} listening={false} />
      {isSelected && <Line points={points} stroke='#2563eb' strokeWidth={2} listening={false} />}
    </Group>
  );
});
