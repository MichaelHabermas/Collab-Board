import type { ReactElement } from 'react';
import { useBoardMetadata, useBoardLoadStatus } from '@/store/boardStore';
import { useBoardRoom } from '@/hooks/useBoardRoom';
import { usePresenceSync } from '@/hooks/usePresenceSync';
import { Board } from './Board';

const DEFAULT_BOARD_ID = 'default-board';

/**
 * Wrapper for the infinite canvas. Renders Board (Stage + grid, objects, selection, cursor layers) in a full-viewport container.
 * Joins the socket room for the current board when connected.
 * Shows a loading indicator until board:load is received.
 * Syncs presence (online users) via usePresenceSync.
 */
export const InfiniteCanvas = (): ReactElement => {
  const { boardId } = useBoardMetadata();
  const boardLoadStatus = useBoardLoadStatus();
  const effectiveBoardId = boardId || DEFAULT_BOARD_ID;
  useBoardRoom(effectiveBoardId);
  usePresenceSync();

  return (
    <div data-testid='canvas-infinite-canvas' className='relative h-full w-full overflow-hidden'>
      {boardLoadStatus === 'loading' && (
        <div
          data-testid='canvas-loading-indicator'
          className='absolute inset-0 z-10 flex items-center justify-center bg-background/80'
        >
          <span className='text-muted-foreground'>Loading board…</span>
        </div>
      )}
      <Board />
    </div>
  );
};
