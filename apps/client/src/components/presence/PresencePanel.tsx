import type { ReactElement } from 'react';
import { useOnlineUsersList } from '@/store/collaborationStore';
import { authStore } from '@/store/authStore';

/**
 * Shows connected users (names and avatars) for the current board room.
 * Excludes current user so "No one else online" is accurate.
 * Updates when presence:join, presence:leave, presence:list are received.
 */
export const PresencePanel = (): ReactElement => {
  const users = useOnlineUsersList();
  const currentUserId = authStore((state) => state.userId);
  const otherUsers = users.filter((u) => u.userId !== currentUserId);

  return (
    <div
      data-testid='presence-panel'
      className='flex shrink-0 items-center gap-2 border-l border-border pl-2'
      aria-label='Online users'
    >
      {otherUsers.length === 0 ? (
        <span className='text-muted-foreground text-xs'>No one else online</span>
      ) : (
        <ul className='flex list-none flex-wrap items-center gap-2 p-0'>
          {otherUsers.map((user) => (
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
