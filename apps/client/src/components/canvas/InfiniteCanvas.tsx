import type { ReactElement } from 'react';
import { useBoardMetadata } from '@/store/boardStore';
import { useBoardRoom } from '@/hooks/useBoardRoom';
import { Board } from './Board';

const DEFAULT_BOARD_ID = 'default-board';

/**
 * Wrapper for the infinite canvas. Renders Board (Stage + grid, objects, selection, cursor layers) in a full-viewport container.
 * Joins the socket room for the current board when connected.
 */
export const InfiniteCanvas = (): ReactElement => {
  const { boardId } = useBoardMetadata();
  const effectiveBoardId = boardId || DEFAULT_BOARD_ID;
  useBoardRoom(effectiveBoardId);

  return (
    <div data-testid='canvas-infinite-canvas' className='h-full w-full overflow-hidden'>
      <Board />
    </div>
  );
};
