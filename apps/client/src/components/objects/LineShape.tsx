import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Line } from 'react-konva';
import type { LineShape as ILineShape } from '@collab-board/shared-types';
import { useDraggableBoardObject } from '@/hooks/useDraggableBoardObject';

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
  const { draggable, handlePointerDown, handleClick, handleDragMove, handleDragEnd } =
    useDraggableBoardObject(id);

  return (
    <Group
      ref={registerRef}
      data-testid={`object-line-${id}`}
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
      <Line points={points} stroke={strokeColor} strokeWidth={strokeWidth} listening />
      {isSelected && <Line points={points} stroke='#2563eb' strokeWidth={2} listening={false} />}
    </Group>
  );
});
