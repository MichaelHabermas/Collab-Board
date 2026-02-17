import type { Board, BoardObject } from '@collab-board/shared-types';
import type { StorageAdapter } from '../../shared/interfaces/storage-adapter';
import { BoardModel } from './board.model';
import { BoardObjectModel } from './object.model';

const toBoardEntity = (doc: InstanceType<typeof BoardModel>): Board => ({
  id: String(doc._id),
  title: doc.title,
  ownerId: doc.ownerId,
  collaborators: doc.collaborators,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const toObjectEntity = (doc: InstanceType<typeof BoardObjectModel>): BoardObject => {
  const base = {
    id: doc.id,
    boardId: doc.boardId,
    type: doc.type,
    x: doc.x,
    y: doc.y,
    width: doc.width,
    height: doc.height,
    rotation: doc.rotation,
    zIndex: doc.zIndex,
    color: doc.color,
    createdBy: doc.createdBy,
    updatedAt: doc.updatedAt.toISOString(),
  };

  switch (doc.type) {
    case 'sticky_note':
      return {
        ...base,
        type: 'sticky_note',
        content: doc.content ?? '',
        fontSize: doc.fontSize ?? 14,
      };
    case 'rectangle':
      return {
        ...base,
        type: 'rectangle',
        strokeColor: doc.strokeColor ?? '#000000',
        strokeWidth: doc.strokeWidth ?? 1,
        fillOpacity: doc.fillOpacity ?? 1,
      };
    case 'circle':
      return {
        ...base,
        type: 'circle',
        radius: doc.radius ?? 50,
        strokeColor: doc.strokeColor ?? '#000000',
        strokeWidth: doc.strokeWidth ?? 1,
        fillOpacity: doc.fillOpacity ?? 1,
      };
    case 'line':
      return {
        ...base,
        type: 'line',
        points: doc.points ?? [],
        strokeColor: doc.strokeColor ?? '#000000',
        strokeWidth: doc.strokeWidth ?? 1,
      };
    case 'frame':
      return { ...base, type: 'frame', label: doc.label ?? '', childIds: doc.childIds ?? [] };
    case 'connector':
      return {
        ...base,
        type: 'connector',
        sourceId: doc.sourceId ?? '',
        targetId: doc.targetId ?? '',
        points: doc.points ?? [],
        strokeColor: doc.strokeColor ?? '#000000',
        strokeWidth: doc.strokeWidth ?? 1,
      };
    case 'text':
      return {
        ...base,
        type: 'text',
        content: doc.content ?? '',
        fontSize: doc.fontSize ?? 14,
        fontWeight: doc.fontWeight ?? 'normal',
        textAlign: doc.textAlign ?? 'left',
      };
    default:
      return { ...base, type: 'sticky_note', content: '', fontSize: 14 };
  }
};

export class BoardRepository implements StorageAdapter {
  async findObjectsByBoard(boardId: string): Promise<BoardObject[]> {
    const docs = await BoardObjectModel.find({ boardId }).sort({ zIndex: 1 });
    return docs.map(toObjectEntity);
  }

  async createObject(obj: BoardObject): Promise<BoardObject> {
    const doc = await BoardObjectModel.create(obj);
    return toObjectEntity(doc);
  }

  async updateObject(id: string, delta: Partial<BoardObject>): Promise<BoardObject | null> {
    const doc = await BoardObjectModel.findOneAndUpdate({ id }, { $set: delta }, { new: true });
    return doc ? toObjectEntity(doc) : null;
  }

  async deleteObject(id: string): Promise<void> {
    await BoardObjectModel.deleteOne({ id });
  }

  async createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> {
    const doc = await BoardModel.create(board);
    return toBoardEntity(doc);
  }

  async findBoardById(id: string): Promise<Board | null> {
    const doc = await BoardModel.findById(id);
    return doc ? toBoardEntity(doc) : null;
  }

  async findBoardsByUser(userId: string): Promise<Board[]> {
    const docs = await BoardModel.find({
      $or: [{ ownerId: userId }, { collaborators: userId }],
    }).sort({ updatedAt: -1 });
    return docs.map(toBoardEntity);
  }

  async updateBoard(id: string, delta: Partial<Board>): Promise<Board | null> {
    const doc = await BoardModel.findByIdAndUpdate(id, { $set: delta }, { new: true });
    return doc ? toBoardEntity(doc) : null;
  }

  async deleteBoard(id: string): Promise<void> {
    await BoardModel.findByIdAndDelete(id);
    await BoardObjectModel.deleteMany({ boardId: id });
  }
}
