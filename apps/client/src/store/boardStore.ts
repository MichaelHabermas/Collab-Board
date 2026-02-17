import { create } from 'zustand';
import type { BoardObject, ObjectType } from '@collab-board/shared-types';

const now = (): string => new Date().toISOString();

interface IBoardState {
  objects: BoardObject[];
  addObject: (object: BoardObject) => void;
  updateObject: (id: string, patch: Partial<BoardObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: BoardObject[]) => void;
  clearBoard: () => void;
}

export const boardStore = create<IBoardState>((set) => ({
  objects: [],

  addObject: (object: BoardObject) => {
    set((state) => ({
      objects: [...state.objects, { ...object, updatedAt: now() }],
    }));
  },

  updateObject: (id: string, patch: Partial<BoardObject>) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...patch, updatedAt: now() } : obj
      ),
    }));
  },

  removeObject: (id: string) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    }));
  },

  setObjects: (objects: BoardObject[]) => {
    set({ objects });
  },

  clearBoard: () => {
    set({ objects: [] });
  },
}));

export function useAllObjects(): BoardObject[] {
  return boardStore((state) => state.objects);
}

export function useObject(id: string): BoardObject | undefined {
  return boardStore((state) => state.objects.find((obj) => obj.id === id));
}

export function useObjectsByType(type: ObjectType): BoardObject[] {
  return boardStore((state) => state.objects.filter((obj) => obj.type === type));
}
