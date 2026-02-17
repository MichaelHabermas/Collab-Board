import type { ReactElement } from 'react';
import { memo } from 'react';
import { boardStore, useObject } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

const STICKY_COLORS = [
  '#fef08a',
  '#fecaca',
  '#bbf7d0',
  '#bfdbfe',
  '#e9d5ff',
  '#fed7aa',
  '#fbcfe8',
  '#e5e7eb',
];

interface IColorPickerProps {
  objectId: string;
  className?: string;
}

export const ColorPicker = memo(function ColorPicker({
  objectId,
  className,
}: IColorPickerProps): ReactElement {
  const obj = useObject(objectId);
  const { socket } = useSocket();
  if (!obj || obj.type !== 'sticky_note') return <></>;

  const currentColor = obj.color;

  const handleColorClick = (color: string): void => {
    boardStore.getState().updateObject(objectId, { color });
    const boardId = boardStore.getState().boardId;
    if (socket && boardId) {
      socket.emit('object:update', { boardId, objectId, delta: { color } });
    }
  };

  return (
    <div
      data-testid='color-picker'
      className={cn('flex flex-wrap gap-1 p-2', className)}
      role='group'
      aria-label='Sticky note color'
    >
      {STICKY_COLORS.map((color) => (
        <button
          key={color}
          type='button'
          data-testid={`color-swatch-${color}`}
          className='h-6 w-6 rounded border-2 border-border transition-transform hover:scale-110'
          style={{ backgroundColor: color }}
          onClick={() => handleColorClick(color)}
          aria-label={`Set color to ${color}`}
          aria-pressed={currentColor === color}
        />
      ))}
    </div>
  );
});
