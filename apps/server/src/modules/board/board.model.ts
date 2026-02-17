import mongoose, { type Document } from 'mongoose';

export interface BoardDocument extends Document {
  title: string;
  ownerId: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new mongoose.Schema<BoardDocument>(
  {
    title: { type: String, required: true, default: 'Untitled Board' },
    ownerId: { type: String, required: true, index: true },
    collaborators: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

boardSchema.index({ collaborators: 1 });

export const BoardModel = mongoose.model<BoardDocument>('Board', boardSchema);
