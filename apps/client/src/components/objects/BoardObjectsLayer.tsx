import type { ReactElement } from 'react';
import { Layer } from 'react-konva';
import { useAllObjects, useSelectedObjectIds } from '@/store/boardStore';
import { StableRefWrapper } from './StableRefWrapper';
import { StickyNoteShape } from './StickyNoteShape';
import { RectangleShapeComponent } from './RectangleShape';
import { CircleShapeComponent } from './CircleShape';
import { LineShapeComponent } from './LineShape';
import type {
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
} from '@collab-board/shared-types';

interface IBoardObjectsLayerProps {
  onStickyDoubleClick?: (id: string) => void;
  registerNodeRef?: (id: string, node: unknown) => void;
}

export const BoardObjectsLayer = ({
  onStickyDoubleClick,
  registerNodeRef,
}: IBoardObjectsLayerProps): ReactElement => {
  const objects = useAllObjects();
  const selectedIds = useSelectedObjectIds();
  const selectedSet = new Set(selectedIds);

  const stickies = objects.filter((obj): obj is StickyNote => obj.type === 'sticky_note');
  const rectangles = objects.filter((obj): obj is RectangleShape => obj.type === 'rectangle');
  const circles = objects.filter((obj): obj is CircleShape => obj.type === 'circle');
  const lines = objects.filter((obj): obj is LineShape => obj.type === 'line');

  return (
    <Layer data-testid='canvas-board-layer-objects' name='objects'>
      {stickies.map((sticky) => (
        <StableRefWrapper key={sticky.id} id={sticky.id} registerNodeRef={registerNodeRef}>
          <StickyNoteShape
            sticky={sticky}
            isSelected={selectedSet.has(sticky.id)}
            onDoubleClick={onStickyDoubleClick}
          />
        </StableRefWrapper>
      ))}
      {rectangles.map((shape) => (
        <StableRefWrapper key={shape.id} id={shape.id} registerNodeRef={registerNodeRef}>
          <RectangleShapeComponent shape={shape} isSelected={selectedSet.has(shape.id)} />
        </StableRefWrapper>
      ))}
      {circles.map((shape) => (
        <StableRefWrapper key={shape.id} id={shape.id} registerNodeRef={registerNodeRef}>
          <CircleShapeComponent shape={shape} isSelected={selectedSet.has(shape.id)} />
        </StableRefWrapper>
      ))}
      {lines.map((shape) => (
        <StableRefWrapper key={shape.id} id={shape.id} registerNodeRef={registerNodeRef}>
          <LineShapeComponent shape={shape} isSelected={selectedSet.has(shape.id)} />
        </StableRefWrapper>
      ))}
    </Layer>
  );
};
