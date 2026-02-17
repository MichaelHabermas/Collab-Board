export interface IBoardWithAccess {
  ownerId: string;
  collaborators: string[];
}

/**
 * Returns true if the user can access the board (is owner or in collaborators).
 */
export const canAccessBoard = (board: IBoardWithAccess, userId: string): boolean => {
  if (!userId) return false;
  return board.ownerId === userId || board.collaborators.includes(userId);
};
