export type ObjectType =
  | 'sticky_note'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'frame'
  | 'connector'
  | 'text';

export interface BoardObjectBase {
  id: string;
  boardId: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  color: string;
  createdBy: string;
  updatedAt: string;
}

export interface StickyNote extends BoardObjectBase {
  type: 'sticky_note';
  content: string;
  fontSize: number;
}

export interface RectangleShape extends BoardObjectBase {
  type: 'rectangle';
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
}

export interface CircleShape extends BoardObjectBase {
  type: 'circle';
  radius: number;
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
}

export interface LineShape extends BoardObjectBase {
  type: 'line';
  points: number[];
  strokeColor: string;
  strokeWidth: number;
}

export interface Frame extends BoardObjectBase {
  type: 'frame';
  label: string;
  childIds: string[];
}

export interface Connector extends BoardObjectBase {
  type: 'connector';
  sourceId: string;
  targetId: string;
  points: number[];
  strokeColor: string;
  strokeWidth: number;
}

export interface TextElement extends BoardObjectBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
}

export type BoardObject =
  | StickyNote
  | RectangleShape
  | CircleShape
  | LineShape
  | Frame
  | Connector
  | TextElement;

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  cursor: { x: number; y: number } | null;
  lastSeen: string;
}
