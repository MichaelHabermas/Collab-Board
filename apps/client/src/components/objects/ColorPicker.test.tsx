import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ColorPicker } from './ColorPicker';
import { boardStore } from '@/store/boardStore';
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
  content: '',
  fontSize: 14,
  ...overrides,
});

describe('ColorPicker', () => {
  beforeEach(() => {
    boardStore.setState({
      objects: [createSticky({ id: 's1', color: '#fef08a' })],
      selectedObjectIds: [],
    });
  });

  it('renders nothing when object is not a sticky', () => {
    const rect = {
      ...createSticky(),
      id: 'rect-1',
      type: 'rectangle' as const,
      strokeColor: '#000',
      strokeWidth: 1,
      fillOpacity: 1,
    };
    boardStore.setState({ objects: [rect] });
    render(<ColorPicker objectId='rect-1' />);
    expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
  });

  it('renders color swatches for sticky and updates store on click', () => {
    boardStore.setState({ objects: [createSticky({ id: 's1', color: '#fef08a' })] });
    render(<ColorPicker objectId='s1' />);
    expect(screen.getByTestId('color-picker')).toBeInTheDocument();
    const redSwatch = screen.getByTestId('color-swatch-#fecaca');
    fireEvent.click(redSwatch);
    const updated = boardStore.getState().objects.find((o) => o.id === 's1');
    expect(updated?.color).toBe('#fecaca');
  });
});
