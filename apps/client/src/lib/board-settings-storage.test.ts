import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPersistedSettings,
  setPersistedSettings,
} from './board-settings-storage';

const STORAGE_KEY = 'collab-board-settings';

describe('board-settings-storage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns empty object when nothing persisted', () => {
    expect(getPersistedSettings()).toEqual({});
  });

  it('round-trips activeToolType', () => {
    setPersistedSettings({ activeToolType: 'sticky_note' });
    expect(getPersistedSettings()).toEqual({ activeToolType: 'sticky_note' });

    setPersistedSettings({ activeToolType: 'select' });
    expect(getPersistedSettings()).toEqual({ activeToolType: 'select' });
  });

  it('round-trips boardId', () => {
    setPersistedSettings({ boardId: 'board-123' });
    expect(getPersistedSettings()).toEqual({ boardId: 'board-123' });
  });

  it('merges partial updates with existing settings', () => {
    setPersistedSettings({ activeToolType: 'rectangle', boardId: 'b1' });
    setPersistedSettings({ boardId: 'b2' });
    expect(getPersistedSettings()).toEqual({
      activeToolType: 'rectangle',
      boardId: 'b2',
    });
  });

  it('ignores invalid activeToolType from storage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeToolType: 'invalid_tool' })
    );
    expect(getPersistedSettings()).toEqual({});
  });

  it('ignores empty boardId from storage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boardId: '' }));
    expect(getPersistedSettings()).toEqual({});
  });
});
