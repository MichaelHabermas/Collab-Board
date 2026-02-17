import type { ReactElement } from 'react';
import { Board } from './Board';

/**
 * Wrapper for the infinite canvas. Renders Board (Stage + grid, objects, selection, cursor layers) in a full-viewport container.
 */
export const InfiniteCanvas = (): ReactElement => {
  return (
    <div data-testid='canvas-infinite-canvas' className='h-full w-full overflow-hidden'>
      <Board />
    </div>
  );
};
