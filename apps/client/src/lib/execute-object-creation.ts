import type { CollabSocket } from '@/hooks/useSocket';
import type { ActiveToolType } from '@/store/boardStore';
import { boardStore } from '@/store/boardStore';
import {
  createStickyNote,
  createRectangle,
  createCircle,
  createLine,
} from '@/lib/create-board-object';
import type {
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
} from '@collab-board/shared-types';

type CreatedObject = StickyNote | RectangleShape | CircleShape | LineShape;

const CREATION_TOOLS: ActiveToolType[] = ['sticky_note', 'rectangle', 'circle', 'line'];

function isCreationTool(
  tool: ActiveToolType
): tool is 'sticky_note' | 'rectangle' | 'circle' | 'line' {
  return CREATION_TOOLS.includes(tool);
}

/**
 * Creates a board object for the given tool and either emits object:create (when socket is set)
 * or adds it to the board store (when socket is null). Used by the canvas on click.
 */
export function executeObjectCreation(
  socket: CollabSocket | null,
  tool: ActiveToolType,
  boardId: string,
  boardX: number,
  boardY: number,
  createdBy: string
): void {
  if (!isCreationTool(tool)) {
    return;
  }
  let obj: CreatedObject;
  if (tool === 'sticky_note') {
    obj = createStickyNote(boardId, boardX, boardY, createdBy);
  } else if (tool === 'rectangle') {
    obj = createRectangle(boardId, boardX, boardY, createdBy);
  } else if (tool === 'circle') {
    obj = createCircle(boardId, boardX, boardY, createdBy);
  } else {
    obj = createLine(boardId, boardX, boardY, createdBy);
  }
  // Defer store update to avoid infinite loop: Konva's pointerup runs during React commit;
  // a synchronous setState here retriggers render and Konva schedules another update.
  queueMicrotask(() => {
    boardStore.getState().addObject(obj);
    boardStore.getState().setActiveTool('select');
  });
  if (socket) {
    const object = Object.fromEntries(
      Object.entries(obj).filter(([k]) => k !== 'updatedAt')
    ) as Omit<CreatedObject, 'updatedAt'>;
    socket.emit('object:create', { boardId, object });
  }
}
