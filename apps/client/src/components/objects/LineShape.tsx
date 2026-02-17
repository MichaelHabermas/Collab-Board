import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Line } from 'react-konva';
import type { LineShape as ILineShape } from '@collab-board/shared-types';
import { boardStore, useActiveToolType, useBoardMetadata } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';

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
  const { id, x, y, rotation, points, strokeColor, strokeWidth } = shape;
  const activeToolType = useActiveToolType();
  const { boardId } = useBoardMetadata();
  const { socket } = useSocket();
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
    const nx = e.target.x();
    const ny = e.target.y();
    boardStore.getState().updateObject(id, { x: nx, y: ny });
    if (socket && boardId) {
      socket.emit('object:move', { boardId, objectId: id, x: nx, y: ny });
    }
  };

  return (
    <Group
      ref={registerRef}
      data-testid={`object-line-${id}`}
      x={x}
      y={y}
      rotation={rotation}
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
