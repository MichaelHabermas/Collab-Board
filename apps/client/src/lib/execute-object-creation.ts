import type { CollabSocket } from '@/hooks/useSocket';
import type { ActiveToolType } from '@/store/boardStore';
import { boardStore } from '@/store/boardStore';
import {
  createStickyNote,
  createRectangle,
  createCircle,
  createLine,
} from '@/lib/create-board-object';
import type { IBoxCreationGeometry, ILineCreationGeometry } from '@/lib/drag-creation-geometry';
import type {
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
} from '@collab-board/shared-types';

type CreatedObject = StickyNote | RectangleShape | CircleShape | LineShape;

/** Optional drag-to-create payload; when omitted, object is created at (boardX, boardY) with default size. */
export type CreationPayload = IBoxCreationGeometry | ILineCreationGeometry;

function isBoxPayload(p: CreationPayload): p is IBoxCreationGeometry {
  return 'width' in p && 'height' in p && !('dx' in p);
}

const CREATION_TOOLS: ActiveToolType[] = ['sticky_note', 'rectangle', 'circle', 'line'];

function isCreationTool(
  tool: ActiveToolType
): tool is 'sticky_note' | 'rectangle' | 'circle' | 'line' {
  return CREATION_TOOLS.includes(tool);
}

/**
 * Creates a board object for the given tool and either emits object:create (when socket is set)
 * or adds it to the board store (when socket is null). Used by the canvas on click or drag end.
 * When payload is provided (drag-to-create), position and dimensions come from the payload.
 */
export function executeObjectCreation(
  socket: CollabSocket | null,
  tool: ActiveToolType,
  boardId: string,
  boardX: number,
  boardY: number,
  createdBy: string,
  payload?: CreationPayload
): void {
  if (!isCreationTool(tool)) {
    return;
  }
  const useBox = payload && isBoxPayload(payload);
  const useLine = payload && !isBoxPayload(payload);
  const x = useBox ? payload.x : useLine ? payload.x : boardX;
  const y = useBox ? payload.y : useLine ? payload.y : boardY;

  let obj: CreatedObject;
  if (tool === 'sticky_note') {
    obj = createStickyNote(
      boardId,
      x,
      y,
      createdBy,
      useBox ? { width: payload.width, height: payload.height } : undefined
    );
  } else if (tool === 'rectangle') {
    obj = createRectangle(
      boardId,
      x,
      y,
      createdBy,
      useBox ? { width: payload.width, height: payload.height } : undefined
    );
  } else if (tool === 'circle') {
    const circleCenterX = useBox ? payload.x + payload.width / 2 : x;
    const circleCenterY = useBox ? payload.y + payload.height / 2 : y;
    obj = createCircle(
      boardId,
      circleCenterX,
      circleCenterY,
      createdBy,
      useBox ? { width: payload.width, height: payload.height } : undefined
    );
  } else {
    obj = createLine(
      boardId,
      x,
      y,
      createdBy,
      useLine ? { dx: payload.dx, dy: payload.dy, length: payload.length } : undefined
    );
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
