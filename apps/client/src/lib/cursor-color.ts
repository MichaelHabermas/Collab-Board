const CURSOR_PALETTE = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#0891b2', // cyan
  '#ea580c', // orange
  '#be185d', // pink
];

/**
 * Returns a stable color for a userId for cursor display.
 */
export function getCursorColorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_PALETTE.length;
  return CURSOR_PALETTE[index] ?? CURSOR_PALETTE[0]!;
}
