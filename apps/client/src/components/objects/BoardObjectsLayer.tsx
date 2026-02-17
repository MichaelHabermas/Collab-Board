import type { ReactElement } from 'react';
import { Layer } from 'react-konva';
import { useAllObjects, useSelectedObjectIds } from '@/store/boardStore';
import { StickyNoteShape } from './StickyNoteShape';
import type { StickyNote } from '@collab-board/shared-types';

interface IBoardObjectsLayerProps {
  onStickyDoubleClick?: (id: string) => void;
}

export const BoardObjectsLayer = ({
  onStickyDoubleClick,
}: IBoardObjectsLayerProps): ReactElement => {
  const objects = useAllObjects();
  const selectedIds = useSelectedObjectIds();
  const selectedSet = new Set(selectedIds);

  const stickies = objects.filter((obj): obj is StickyNote => obj.type === 'sticky_note');

  return (
    <Layer data-testid='canvas-board-layer-objects' name='objects'>
      {stickies.map((sticky) => (
        <StickyNoteShape
          key={sticky.id}
          sticky={sticky}
          isSelected={selectedSet.has(sticky.id)}
          onDoubleClick={onStickyDoubleClick}
        />
      ))}
    </Layer>
  );
};
