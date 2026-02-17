import type { StickyNote } from '@collab-board/shared-types';

const now = (): string => new Date().toISOString();

export function createStickyNote(
  boardId: string,
  x: number,
  y: number,
  createdBy: string
): StickyNote {
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'sticky_note',
    x,
    y,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: 0,
    color: '#fef08a',
    createdBy,
    updatedAt: now(),
    content: '',
    fontSize: 14,
  };
}
