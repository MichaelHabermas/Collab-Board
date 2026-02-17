import { useCallback } from 'react';
import { boardStore, useActiveToolType, useBoardMetadata } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';

/** Konva-style pointer/click event (MouseEvent or TouchEvent on evt) */
export interface IKonvaPointerEvent {
  evt?: MouseEvent | TouchEvent;
}

/** Konva-style drag event with target position getters */
export interface IKonvaDragEvent {
  target: { x: () => number; y: () => number };
}

function applySelectionFromEvent(objectId: string, e: IKonvaPointerEvent): void {
  const shiftKey = !!e.evt?.shiftKey;
  if (shiftKey) {
    boardStore.getState().toggleSelection(objectId);
  } else {
    boardStore.getState().selectObject(objectId);
  }
}

export interface IUseDraggableBoardObjectResult {
  draggable: boolean;
  handlePointerDown: (e: IKonvaPointerEvent) => void;
  handleClick: (e: IKonvaPointerEvent) => void;
  handleDragMove: (e: IKonvaDragEvent) => void;
  handleDragEnd: (e: IKonvaDragEvent) => void;
}

/**
 * Shared behavior for draggable board objects: selection (click/shift+click),
 * drag move/end with store update and socket sync.
 */
export const useDraggableBoardObject = (objectId: string): IUseDraggableBoardObjectResult => {
  const activeToolType = useActiveToolType();
  const { boardId } = useBoardMetadata();
  const { socket } = useSocket();

  const draggable = activeToolType === 'select';

  const handlePointerDown = useCallback(
    (e: IKonvaPointerEvent): void => {
      if (activeToolType !== 'select') {
        return;
      }
      applySelectionFromEvent(objectId, e);
    },
    [objectId, activeToolType]
  );

  const handleClick = useCallback(
    (e: IKonvaPointerEvent): void => {
      applySelectionFromEvent(objectId, e);
    },
    [objectId]
  );

  const handleDragMove = useCallback(
    (e: IKonvaDragEvent): void => {
      boardStore.getState().updateObject(objectId, { x: e.target.x(), y: e.target.y() });
    },
    [objectId]
  );

  const handleDragEnd = useCallback(
    (e: IKonvaDragEvent): void => {
      const nx = e.target.x();
      const ny = e.target.y();
      boardStore.getState().updateObject(objectId, { x: nx, y: ny });
      if (socket && boardId) {
        socket.emit('object:move', { boardId, objectId, x: nx, y: ny });
      }
    },
    [objectId, socket, boardId]
  );

  return {
    draggable,
    handlePointerDown,
    handleClick,
    handleDragMove,
    handleDragEnd,
  };
};
