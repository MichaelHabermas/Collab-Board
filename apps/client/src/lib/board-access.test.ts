import { describe, it, expect } from 'vitest';
import { canAccessBoard } from './board-access';

describe('canAccessBoard', () => {
  const board = { ownerId: 'owner_1', collaborators: ['collab_1', 'collab_2'] };

  it('returns true when user is owner', () => {
    expect(canAccessBoard(board, 'owner_1')).toBe(true);
  });

  it('returns true when user is in collaborators', () => {
    expect(canAccessBoard(board, 'collab_1')).toBe(true);
    expect(canAccessBoard(board, 'collab_2')).toBe(true);
  });

  it('returns false when user is not owner or collaborator', () => {
    expect(canAccessBoard(board, 'other')).toBe(false);
  });

  it('returns false when userId is empty', () => {
    expect(canAccessBoard(board, '')).toBe(false);
  });
});
