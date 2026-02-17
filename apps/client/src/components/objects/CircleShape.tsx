import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Ellipse } from 'react-konva';
import type { CircleShape as ICircleShape } from '@collab-board/shared-types';
import { boardStore, useActiveToolType, useBoardMetadata } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';

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
  const { id, x, y, rotation, width, height, color, strokeColor, strokeWidth, fillOpacity } =
    shape;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const activeToolType = useActiveToolType();
  const { boardId } = useBoardMetadata();
  const { socket } = useSocket();
  const draggable = activeToolType === 'select';

  const handlePointerDown = (e: { evt: MouseEvent | TouchEvent }): void => {
    if (activeToolType !== 'select') {
      return;
    }
    const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
    if (shiftKey) {
      boardStore.getState().toggleSelection(id);
    } else {
      boardStore.getState().selectObject(id);
    }
  };

  const handleClick = (e: { evt: MouseEvent | TouchEvent }): void => {
    const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
    if (shiftKey) {
      boardStore.getState().toggleSelection(id);
    } else {
      boardStore.getState().selectObject(id);
    }
  };

  const handleDragMove = (e: { target: { x: () => number; y: () => number } }): void => {
    boardStore.getState().updateObject(id, { x: e.target.x(), y: e.target.y() });
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
        fill={color}
        opacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
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
