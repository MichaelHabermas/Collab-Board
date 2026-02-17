import type {
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
} from '@collab-board/shared-types';

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

export function createRectangle(
  boardId: string,
  x: number,
  y: number,
  createdBy: string
): RectangleShape {
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'rectangle',
    x,
    y,
    width: 100,
    height: 80,
    rotation: 0,
    zIndex: 0,
    color: '#93c5fd',
    createdBy,
    updatedAt: now(),
    strokeColor: '#1d4ed8',
    strokeWidth: 2,
    fillOpacity: 0.3,
  };
}

export function createCircle(
  boardId: string,
  x: number,
  y: number,
  createdBy: string
): CircleShape {
  const radius = 50;
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'circle',
    x,
    y,
    width: radius * 2,
    height: radius * 2,
    rotation: 0,
    zIndex: 0,
    color: '#93c5fd',
    createdBy,
    updatedAt: now(),
    radius,
    strokeColor: '#1d4ed8',
    strokeWidth: 2,
    fillOpacity: 0.3,
  };
}

export function createLine(boardId: string, x: number, y: number, createdBy: string): LineShape {
  const length = 100;
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'line',
    x,
    y,
    width: length,
    height: 0,
    rotation: 0,
    zIndex: 0,
    color: '#64748b',
    createdBy,
    updatedAt: now(),
    points: [0, 0, length, 0],
    strokeColor: '#475569',
    strokeWidth: 2,
  };
}
