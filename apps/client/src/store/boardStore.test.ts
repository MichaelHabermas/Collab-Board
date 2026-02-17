import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from './boardStore';
import type { StickyNote } from '@collab-board/shared-types';

const createSticky = (overrides: Partial<StickyNote> = {}): StickyNote => ({
  id: 'sticky-1',
  boardId: 'board-1',
  type: 'sticky_note',
  x: 0,
  y: 0,
  width: 120,
  height: 80,
  rotation: 0,
  zIndex: 0,
  color: '#fef08a',
  createdBy: 'user-1',
  updatedAt: new Date().toISOString(),
  content: 'Hello',
  fontSize: 14,
  ...overrides,
});

describe('boardStore', () => {
  beforeEach(() => {
    boardStore.setState({
      boardId: '',
      title: '',
      objects: [],
      boardLoadStatus: 'idle',
      activeToolType: 'select',
      selectedObjectIds: [],
    });
  });

  describe('object actions', () => {
    it('addObject appends object and sets updatedAt', () => {
      const sticky = createSticky({ id: 's1' });
      boardStore.getState().addObject(sticky);
      expect(boardStore.getState().objects).toHaveLength(1);
      expect(boardStore.getState().objects[0].id).toBe('s1');
      expect(boardStore.getState().objects[0].updatedAt).toBeDefined();
    });

    it('updateObject merges patch and updates updatedAt', () => {
      const sticky = createSticky({ id: 's1', content: 'Old' });
      boardStore.getState().addObject(sticky);
      boardStore.getState().updateObject('s1', { content: 'New' });
      const obj = boardStore.getState().objects[0];
      expect(obj.type).toBe('sticky_note');
      expect((obj as StickyNote).content).toBe('New');
      expect(obj.updatedAt).toBeDefined();
    });

    it('removeObject removes object and clears selection for that id', () => {
      const sticky = createSticky({ id: 's1' });
      boardStore.getState().addObject(sticky);
      boardStore.getState().selectObject('s1');
      boardStore.getState().removeObject('s1');
      expect(boardStore.getState().objects).toHaveLength(0);
      expect(boardStore.getState().selectedObjectIds).toHaveLength(0);
    });

    it('setObjects replaces objects array', () => {
      const list = [createSticky({ id: 'a' }), createSticky({ id: 'b' })];
      boardStore.getState().setObjects(list);
      expect(boardStore.getState().objects).toHaveLength(2);
      expect(boardStore.getState().objects.map((o) => o.id)).toEqual(['a', 'b']);
    });

    it('clearBoard clears objects and selectedObjectIds', () => {
      boardStore.getState().addObject(createSticky({ id: 's1' }));
      boardStore.getState().selectObject('s1');
      boardStore.getState().clearBoard();
      expect(boardStore.getState().objects).toHaveLength(0);
      expect(boardStore.getState().selectedObjectIds).toHaveLength(0);
    });
  });

  describe('board metadata and active tool', () => {
    it('setBoardMetadata updates boardId and title', () => {
      boardStore.getState().setBoardMetadata('b1', 'My Board');
      expect(boardStore.getState().boardId).toBe('b1');
      expect(boardStore.getState().title).toBe('My Board');
    });

    it('setActiveTool updates activeToolType', () => {
      boardStore.getState().setActiveTool('sticky_note');
      expect(boardStore.getState().activeToolType).toBe('sticky_note');
      boardStore.getState().setActiveTool('rectangle');
      expect(boardStore.getState().activeToolType).toBe('rectangle');
    });
  });

  describe('selection', () => {
    it('selectObject sets single selected id', () => {
      boardStore.getState().selectObject('id-1');
      expect(boardStore.getState().selectedObjectIds).toEqual(['id-1']);
    });

    it('deselectAll clears selection', () => {
      boardStore.getState().selectObject('id-1');
      boardStore.getState().deselectAll();
      expect(boardStore.getState().selectedObjectIds).toHaveLength(0);
    });

    it('toggleSelection adds id when not selected', () => {
      boardStore.getState().toggleSelection('a');
      expect(boardStore.getState().selectedObjectIds).toEqual(['a']);
      boardStore.getState().toggleSelection('b');
      expect(boardStore.getState().selectedObjectIds).toEqual(['a', 'b']);
    });

    it('toggleSelection removes id when already selected', () => {
      boardStore.getState().toggleSelection('a');
      boardStore.getState().toggleSelection('b');
      boardStore.getState().toggleSelection('a');
      expect(boardStore.getState().selectedObjectIds).toEqual(['b']);
    });

    it('setSelectedObjectIds replaces selection', () => {
      boardStore.getState().setSelectedObjectIds(['a', 'b', 'c']);
      expect(boardStore.getState().selectedObjectIds).toEqual(['a', 'b', 'c']);
      boardStore.getState().setSelectedObjectIds(['x']);
      expect(boardStore.getState().selectedObjectIds).toEqual(['x']);
    });
  });
});
