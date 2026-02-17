import { create } from 'zustand';
import type { BoardObject, ObjectType } from '@collab-board/shared-types';

export type ActiveToolType = 'select' | 'sticky_note' | 'rectangle' | 'circle' | 'line';

const now = (): string => new Date().toISOString();

interface IBoardState {
  boardId: string;
  title: string;
  objects: BoardObject[];
  activeToolType: ActiveToolType;
  selectedObjectIds: string[];
  addObject: (object: BoardObject) => void;
  updateObject: (id: string, patch: Partial<BoardObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: BoardObject[]) => void;
  clearBoard: () => void;
  setActiveTool: (tool: ActiveToolType) => void;
  selectObject: (id: string) => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  setBoardMetadata: (boardId: string, title: string) => void;
}

export const boardStore = create<IBoardState>((set) => ({
  boardId: '',
  title: '',
  objects: [],
  activeToolType: 'select',
  selectedObjectIds: [],

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
      selectedObjectIds: state.selectedObjectIds.filter((sid) => sid !== id),
    }));
  },

  setObjects: (objects: BoardObject[]) => {
    set({ objects });
  },

  clearBoard: () => {
    set({ objects: [], selectedObjectIds: [] });
  },

  setActiveTool: (tool: ActiveToolType) => {
    set({ activeToolType: tool });
  },

  selectObject: (id: string) => {
    set({ selectedObjectIds: [id] });
  },

  deselectAll: () => {
    set({ selectedObjectIds: [] });
  },

  toggleSelection: (id: string) => {
    set((state) => {
      const has = state.selectedObjectIds.includes(id);
      const next = has
        ? state.selectedObjectIds.filter((sid) => sid !== id)
        : [...state.selectedObjectIds, id];
      return { selectedObjectIds: next };
    });
  },

  setBoardMetadata: (boardId: string, title: string) => {
    set({ boardId, title });
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

export function useBoardMetadata(): { boardId: string; title: string } {
  return boardStore((state) => ({ boardId: state.boardId, title: state.title }));
}

export function useActiveToolType(): ActiveToolType {
  return boardStore((state) => state.activeToolType);
}

export function useSelectedObjectIds(): string[] {
  return boardStore((state) => state.selectedObjectIds);
}
