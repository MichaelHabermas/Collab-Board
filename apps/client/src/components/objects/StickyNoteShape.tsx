import type { ReactElement } from 'react';
import { memo } from 'react';
import type Konva from 'konva';
import { Group, Rect, Text } from 'react-konva';
import type { StickyNote as IStickyNote } from '@collab-board/shared-types';
import { useDraggableBoardObject } from '@/hooks/useDraggableBoardObject';

interface IStickyNoteShapeProps {
  sticky: IStickyNote;
  isSelected: boolean;
  onDoubleClick?: (id: string) => void;
  registerRef?: (node: Konva.Group | null) => void;
}

export const StickyNoteShape = memo(function StickyNoteShape({
  sticky,
  isSelected,
  onDoubleClick,
  registerRef,
}: IStickyNoteShapeProps): ReactElement {
  const { id, x, y, width, height, rotation, color, content, fontSize } = sticky;
  const { draggable, handlePointerDown, handleClick, handleDragMove, handleDragEnd } =
    useDraggableBoardObject(id);

  const handleDoubleClick = (): void => {
    onDoubleClick?.(id);
  };

  return (
    <Group
      ref={registerRef}
      data-testid={`object-sticky-${id}`}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragMove={handleDragMove}
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
        listening
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
