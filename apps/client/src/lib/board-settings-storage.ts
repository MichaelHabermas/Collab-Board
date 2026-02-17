import type { ActiveToolType } from '@/store/boardStore';

const STORAGE_KEY = 'collab-board-settings';

export interface IPersistedBoardSettings {
  activeToolType?: ActiveToolType;
  boardId?: string;
}

const VALID_TOOLS: ActiveToolType[] = [
  'select',
  'pan',
  'sticky_note',
  'rectangle',
  'circle',
  'line',
];

function isActiveToolType(value: unknown): value is ActiveToolType {
  return typeof value === 'string' && VALID_TOOLS.includes(value as ActiveToolType);
}

/**
 * Reads persisted board settings from localStorage.
 * Returns only defined, valid keys.
 */
export function getPersistedSettings(): IPersistedBoardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: IPersistedBoardSettings = {};
    if (isActiveToolType(parsed.activeToolType)) {
      out.activeToolType = parsed.activeToolType;
    }
    if (typeof parsed.boardId === 'string' && parsed.boardId.length > 0) {
      out.boardId = parsed.boardId;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Writes the given settings to localStorage. Merges with existing;
 * only provided keys are updated. Omit a key to leave it unchanged in storage.
 */
export function setPersistedSettings(partial: IPersistedBoardSettings): void {
  try {
    const current = getPersistedSettings();
    const next: IPersistedBoardSettings = {
      ...current,
      ...partial,
    };
    if (next.boardId === '') {
      delete next.boardId;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
