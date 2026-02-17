import { z } from 'zod';

const objectTypes = [
  'sticky_note',
  'rectangle',
  'circle',
  'line',
  'frame',
  'connector',
  'text',
] as const;

export const boardObjectBaseSchema = z.object({
  boardId: z.string().min(1),
  type: z.enum(objectTypes),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  zIndex: z.number().int().default(0),
  color: z.string().default('#ffffff'),
  createdBy: z.string().min(1),
});

export const createBoardSchema = z.object({
  title: z.string().min(1).max(200).default('Untitled Board'),
  ownerId: z.string().min(1),
  collaborators: z.array(z.string()).default([]),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  collaborators: z.array(z.string()).optional(),
});

export const boardJoinSchema = z.object({
  boardId: z.string().min(1),
});

export const boardLeaveSchema = z.object({
  boardId: z.string().min(1),
});

export const cursorMoveSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const objectUpdateSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().int().optional(),
  color: z.string().optional(),
  content: z.string().optional(),
  fontSize: z.number().positive().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  label: z.string().optional(),
  points: z.array(z.number()).optional(),
});
