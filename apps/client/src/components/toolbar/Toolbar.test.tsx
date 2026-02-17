import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Toolbar } from './Toolbar';
import { boardStore } from '@/store/boardStore';

describe('Toolbar', () => {
  beforeEach(() => {
    boardStore.setState({ activeToolType: 'select' });
  });

  it('renders toolbar with all tools', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pan$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sticky note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /line/i })).toBeInTheDocument();
  });

  it('highlights active tool', () => {
    boardStore.setState({ activeToolType: 'sticky_note' });
    render(<Toolbar />);
    const stickyButton = screen.getByRole('button', { name: /sticky note/i });
    expect(stickyButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates boardStore activeToolType when tool clicked', () => {
    render(<Toolbar />);
    expect(boardStore.getState().activeToolType).toBe('select');
    fireEvent.click(screen.getByRole('button', { name: /rectangle/i }));
    expect(boardStore.getState().activeToolType).toBe('rectangle');
  });
});
