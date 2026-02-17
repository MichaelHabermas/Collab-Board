import type { ReactElement } from 'react';
import { memo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { StickyNote as IStickyNote } from '@collab-board/shared-types';
import { boardStore } from '@/store/boardStore';

interface IStickyNoteShapeProps {
  sticky: IStickyNote;
  isSelected: boolean;
  onDoubleClick?: (id: string) => void;
}

export const StickyNoteShape = memo(function StickyNoteShape({
  sticky,
  isSelected,
  onDoubleClick,
}: IStickyNoteShapeProps): ReactElement {
  const { id, x, y, width, height, color, content, fontSize } = sticky;

  const handleClick = (): void => {
    boardStore.getState().selectObject(id);
  };

  const handleDoubleClick = (): void => {
    onDoubleClick?.(id);
  };

  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }): void => {
    boardStore.getState().updateObject(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Group
      data-testid={`object-sticky-${id}`}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragEnd={handleDragEnd}
      listening
    >
      <Rect
        width={width}
        height={height}
        fill={color}
        stroke={isSelected ? '#2563eb' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        cornerRadius={4}
        listening={false}
      />
      <Text
        text={content || ' '}
        width={width - 12}
        height={height - 12}
        x={6}
        y={6}
        fontSize={fontSize}
        fill='#1f2937'
        listening={false}
        wrap='word'
      />
    </Group>
  );
});
