import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Line } from 'react-konva';
import type { LineShape as ILineShape } from '@collab-board/shared-types';
import { boardStore, useActiveToolType } from '@/store/boardStore';

interface ILineShapeProps {
  shape: ILineShape;
  isSelected: boolean;
  registerRef?: (node: Konva.Group | null) => void;
}

export const LineShapeComponent = memo(function LineShapeComponent({
  shape,
  isSelected,
  registerRef,
}: ILineShapeProps): ReactElement {
  const { id, x, y, points, strokeColor, strokeWidth } = shape;
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
      data-testid={`object-line-${id}`}
      x={x}
      y={y}
      draggable={draggable}
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
