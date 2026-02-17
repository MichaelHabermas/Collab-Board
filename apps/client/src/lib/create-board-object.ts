import type {
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
} from '@collab-board/shared-types';

const now = (): string => new Date().toISOString();

/** Optional dimensions for drag-to-size creation; when omitted, defaults are used. */
export interface IBoxCreationDimensions {
  width: number;
  height: number;
}

/** Optional line vector for drag-to-size creation; when omitted, default horizontal line is used. */
export interface ILineCreationDimensions {
  dx: number;
  dy: number;
  length: number;
}

export function createStickyNote(
  boardId: string,
  x: number,
  y: number,
  createdBy: string,
  dimensions?: IBoxCreationDimensions
): StickyNote {
  const width = dimensions?.width ?? 120;
  const height = dimensions?.height ?? 80;
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'sticky_note',
    x,
    y,
    width,
    height,
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
  createdBy: string,
  dimensions?: IBoxCreationDimensions
): RectangleShape {
  const width = dimensions?.width ?? 100;
  const height = dimensions?.height ?? 80;
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'rectangle',
    x,
    y,
    width,
    height,
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
  createdBy: string,
  dimensions?: IBoxCreationDimensions
): CircleShape {
  const width = dimensions?.width ?? 100;
  const height = dimensions?.height ?? 100;
  const radius = Math.min(width, height) / 2;
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'circle',
    x,
    y,
    width,
    height,
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

export function createLine(
  boardId: string,
  x: number,
  y: number,
  createdBy: string,
  lineGeometry?: ILineCreationDimensions
): LineShape {
  const dx = lineGeometry?.dx ?? 100;
  const dy = lineGeometry?.dy ?? 0;
  const width = Math.max(1, Math.abs(dx));
  const height = Math.max(1, Math.abs(dy));
  return {
    id: crypto.randomUUID(),
    boardId,
    type: 'line',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    color: '#64748b',
    createdBy,
    updatedAt: now(),
    points: [0, 0, dx, dy],
    strokeColor: '#475569',
    strokeWidth: 2,
  };
}
