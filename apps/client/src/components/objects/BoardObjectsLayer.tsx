import type { ReactElement } from 'react';
import { Layer } from 'react-konva';
import { useAllObjects, useSelectedObjectIds } from '@/store/boardStore';
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
        <StickyNoteShape
          key={sticky.id}
          sticky={sticky}
          isSelected={selectedSet.has(sticky.id)}
          onDoubleClick={onStickyDoubleClick}
          registerRef={registerNodeRef ? (node) => registerNodeRef(sticky.id, node) : undefined}
        />
      ))}
      {rectangles.map((shape) => (
        <RectangleShapeComponent
          key={shape.id}
          shape={shape}
          isSelected={selectedSet.has(shape.id)}
          registerRef={registerNodeRef ? (node) => registerNodeRef(shape.id, node) : undefined}
        />
      ))}
      {circles.map((shape) => (
        <CircleShapeComponent
          key={shape.id}
          shape={shape}
          isSelected={selectedSet.has(shape.id)}
          registerRef={registerNodeRef ? (node) => registerNodeRef(shape.id, node) : undefined}
        />
      ))}
      {lines.map((shape) => (
        <LineShapeComponent
          key={shape.id}
          shape={shape}
          isSelected={selectedSet.has(shape.id)}
          registerRef={registerNodeRef ? (node) => registerNodeRef(shape.id, node) : undefined}
        />
      ))}
    </Layer>
  );
};
