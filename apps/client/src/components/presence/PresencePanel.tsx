import type { ReactElement } from 'react';
import { useOnlineUsersList } from '@/store/collaborationStore';

/**
 * Shows connected users (names and avatars) for the current board room.
 * Updates when presence:join, presence:leave, presence:list are received.
 */
export const PresencePanel = (): ReactElement => {
  const users = useOnlineUsersList();

  return (
    <div
      data-testid='presence-panel'
      className='flex shrink-0 items-center gap-2 border-l border-border pl-2'
      aria-label='Online users'
    >
      {users.length === 0 ? (
        <span className='text-muted-foreground text-xs'>No one else online</span>
      ) : (
        <ul className='flex list-none flex-wrap items-center gap-2 p-0'>
          {users.map((user) => (
            <li
              key={user.userId}
              className='flex items-center gap-1.5'
              data-testid={`presence-user-${user.userId}`}
            >
              <span
                className='h-6 w-6 shrink-0 rounded-full border border-border'
                style={{ backgroundColor: user.color }}
                aria-hidden
              />
              <span className='text-muted-foreground truncate text-xs max-w-[80px]'>
                {user.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
