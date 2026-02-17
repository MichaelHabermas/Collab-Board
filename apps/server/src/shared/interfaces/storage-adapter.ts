import type { Board, BoardObject } from '@collab-board/shared-types';

export interface StorageAdapter {
  findObjectsByBoard(boardId: string): Promise<BoardObject[]>;
  createObject(obj: BoardObject): Promise<BoardObject>;
  updateObject(id: string, delta: Partial<BoardObject>): Promise<BoardObject | null>;
  deleteObject(id: string): Promise<void>;

  createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board>;
  findBoardById(id: string): Promise<Board | null>;
  findBoardsByUser(userId: string): Promise<Board[]>;
  updateBoard(id: string, delta: Partial<Board>): Promise<Board | null>;
  deleteBoard(id: string): Promise<void>;
}
