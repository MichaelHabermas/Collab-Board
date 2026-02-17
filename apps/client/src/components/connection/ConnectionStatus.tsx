import type { ReactElement } from 'react';
import { useSocket } from '@/hooks/useSocket';

/**
 * Visual indicator for socket connection state: connected (green),
 * reconnecting (yellow), disconnected (red). Non-intrusive; used in header.
 */
export const ConnectionStatus = (): ReactElement => {
  const { connectionStatus } = useSocket();

  const config = {
    connected: {
      label: 'Connected',
      dotClass: 'bg-green-500',
      dataTestId: 'connection-status-connected',
    },
    reconnecting: {
      label: 'Reconnecting…',
      dotClass: 'bg-amber-500 animate-pulse',
      dataTestId: 'connection-status-reconnecting',
    },
    disconnected: {
      label: 'Disconnected',
      dotClass: 'bg-red-500',
      dataTestId: 'connection-status-disconnected',
    },
  } as const;

  const { label, dotClass, dataTestId } = config[connectionStatus];

  return (
    <div
      data-testid='connection-status'
      className='flex items-center gap-1.5 text-muted-foreground text-xs'
      aria-live='polite'
      aria-label={`Connection: ${label}`}
    >
      <span
        data-testid={dataTestId}
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`}
        aria-hidden
      />
      <span className='hidden sm:inline'>{label}</span>
    </div>
  );
};
