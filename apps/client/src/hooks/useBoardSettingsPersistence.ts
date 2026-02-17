import { useEffect } from 'react';
import { boardStore } from '@/store/boardStore';
import {
  getPersistedSettings,
  setPersistedSettings,
} from '@/lib/board-settings-storage';

/**
 * Hydrates boardStore from localStorage on mount and persists activeToolType and boardId
 * whenever they change. Call once at app root (e.g. App.tsx).
 */
export function useBoardSettingsPersistence(): void {
  useEffect(() => {
    const settings = getPersistedSettings();
    if (settings.activeToolType) {
      boardStore.getState().setActiveTool(settings.activeToolType);
    }
    if (settings.boardId) {
      boardStore.getState().setBoardMetadata(settings.boardId, '');
    }

    const unsub = boardStore.subscribe((state) => {
      setPersistedSettings({
        activeToolType: state.activeToolType,
        boardId: state.boardId || undefined,
      });
    });

    return unsub;
  }, []);
}
