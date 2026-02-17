import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { BoardObject, ObjectType } from '@collab-board/shared-types';

export type ActiveToolType = 'select' | 'pan' | 'sticky_note' | 'rectangle' | 'circle' | 'line';

export type BoardLoadStatus = 'idle' | 'loading' | 'loaded';

const now = (): string => new Date().toISOString();

interface IBoardState {
  boardId: string;
  title: string;
  objects: BoardObject[];
  boardLoadStatus: BoardLoadStatus;
  activeToolType: ActiveToolType;
  selectedObjectIds: string[];
  addObject: (object: BoardObject) => void;
  updateObject: (id: string, patch: Partial<BoardObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: BoardObject[]) => void;
  setBoardLoadStatus: (status: BoardLoadStatus) => void;
  clearBoard: () => void;
  setActiveTool: (tool: ActiveToolType) => void;
  selectObject: (id: string) => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  setBoardMetadata: (boardId: string, title: string) => void;
}

export const boardStore = create<IBoardState>((set) => ({
  boardId: '',
  title: '',
  objects: [],
  boardLoadStatus: 'idle',
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
        obj.id === id ? ({ ...obj, ...patch, updatedAt: now() } as BoardObject) : obj
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

  setBoardLoadStatus: (boardLoadStatus: BoardLoadStatus) => {
    set({ boardLoadStatus });
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

  setSelectedObjectIds: (ids: string[]) => {
    set({ selectedObjectIds: ids });
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
  return boardStore(useShallow((state) => state.objects.filter((obj) => obj.type === type)));
}

export function useBoardMetadata(): { boardId: string; title: string } {
  return boardStore(useShallow((state) => ({ boardId: state.boardId, title: state.title })));
}

export function useActiveToolType(): ActiveToolType {
  return boardStore((state) => state.activeToolType);
}

export function useSelectedObjectIds(): string[] {
  return boardStore((state) => state.selectedObjectIds);
}

export function useBoardLoadStatus(): BoardLoadStatus {
  return boardStore((state) => state.boardLoadStatus);
}
