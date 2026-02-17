import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Rect } from 'react-konva';
import type { RectangleShape as IRectangleShape } from '@collab-board/shared-types';
import { boardStore, useActiveToolType, useBoardMetadata } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';

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
  const activeToolType = useActiveToolType();
  const { boardId } = useBoardMetadata();
  const { socket } = useSocket();
  const draggable = activeToolType === 'select';

  const handlePointerDown = (e: { evt: MouseEvent | TouchEvent }): void => {
    if (activeToolType !== 'select') {
      return;
    }
    const shiftKey = !!e.evt?.shiftKey;
    if (shiftKey) {
      boardStore.getState().toggleSelection(id);
    } else {
      boardStore.getState().selectObject(id);
    }
  };

  const handleClick = (e: { evt: MouseEvent | TouchEvent }): void => {
    const shiftKey = !!e.evt?.shiftKey;
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
