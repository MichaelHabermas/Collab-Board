import type { ReactElement } from 'react';
import { memo, useEffect } from 'react';
import { MousePointer, StickyNote, Square, Circle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { boardStore, useActiveToolType, type ActiveToolType } from '@/store/boardStore';
import { cn } from '@/lib/utils';

const TOOLS: { tool: ActiveToolType; icon: ReactElement; label: string }[] = [
  { tool: 'select', icon: <MousePointer aria-hidden />, label: 'Select' },
  { tool: 'sticky_note', icon: <StickyNote aria-hidden />, label: 'Sticky note' },
  { tool: 'rectangle', icon: <Square aria-hidden />, label: 'Rectangle' },
  { tool: 'circle', icon: <Circle aria-hidden />, label: 'Circle' },
  { tool: 'line', icon: <Minus aria-hidden />, label: 'Line' },
];

const CURSOR_BY_TOOL: Record<ActiveToolType, string> = {
  select: 'default',
  sticky_note: 'crosshair',
  rectangle: 'crosshair',
  circle: 'crosshair',
  line: 'crosshair',
};

export const Toolbar = memo(function Toolbar(): ReactElement {
  const activeToolType = useActiveToolType();

  useEffect(() => {
    document.body.style.cursor = CURSOR_BY_TOOL[activeToolType];
    return () => {
      document.body.style.cursor = '';
    };
  }, [activeToolType]);

  return (
    <aside
      data-testid='toolbar'
      className='flex w-14 shrink-0 flex-col border-r border-border bg-background py-2'
      role='toolbar'
      aria-label='Board tools'
    >
      {TOOLS.map(({ tool, icon, label }) => {
        const isActive = activeToolType === tool;
        return (
          <Button
            key={tool}
            type='button'
            variant={isActive ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'mx-1 mb-1 h-10 w-10 p-0 last:mb-0',
              isActive && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => boardStore.getState().setActiveTool(tool)}
            aria-pressed={isActive}
            aria-label={label}
            title={label}
          >
            {icon}
          </Button>
        );
      })}
    </aside>
  );
});
