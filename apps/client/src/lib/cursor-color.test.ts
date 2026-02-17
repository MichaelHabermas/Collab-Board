import { describe, it, expect } from 'vitest';
import { getCursorColorForUserId } from './cursor-color';

describe('getCursorColorForUserId', () => {
  it('returns a hex color string', () => {
    const color = getCursorColorForUserId('user-1');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns same color for same userId', () => {
    expect(getCursorColorForUserId('user-abc')).toBe(getCursorColorForUserId('user-abc'));
  });

  it('returns different colors for different userIds (likely)', () => {
    const a = getCursorColorForUserId('user-1');
    const b = getCursorColorForUserId('user-2');
    const c = getCursorColorForUserId('user-3');
    const unique = new Set([a, b, c]);
    expect(unique.size).toBeGreaterThan(1);
  });
});
