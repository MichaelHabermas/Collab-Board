import mongoose, { type Document } from 'mongoose';
import type { ObjectType } from '@collab-board/shared-types';

export interface BoardObjectDocument extends Document {
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

  // StickyNote / TextElement fields
  content?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';

  // Shape fields
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;

  // Circle fields
  radius?: number;

  // Line / Connector fields
  points?: number[];

  // Frame fields
  label?: string;
  childIds?: string[];

  // Connector fields
  sourceId?: string;
  targetId?: string;

  updatedAt: Date;
}

const OBJECT_TYPES: ObjectType[] = [
  'sticky_note',
  'rectangle',
  'circle',
  'line',
  'frame',
  'connector',
  'text',
];

const boardObjectSchema = new mongoose.Schema<BoardObjectDocument>(
  {
    id: { type: String, required: true, unique: true },
    boardId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: OBJECT_TYPES },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number, required: true, default: 100 },
    height: { type: Number, required: true, default: 100 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 0 },
    color: { type: String, default: '#ffffff' },
    createdBy: { type: String, required: true },

    // Optional fields per type
    content: { type: String },
    fontSize: { type: Number },
    fontWeight: { type: String, enum: ['normal', 'bold'] },
    textAlign: { type: String, enum: ['left', 'center', 'right'] },
    strokeColor: { type: String },
    strokeWidth: { type: Number },
    fillOpacity: { type: Number },
    radius: { type: Number },
    points: { type: [Number] },
    label: { type: String },
    childIds: { type: [String] },
    sourceId: { type: String },
    targetId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const BoardObjectModel = mongoose.model<BoardObjectDocument>(
  'BoardObject',
  boardObjectSchema
);
