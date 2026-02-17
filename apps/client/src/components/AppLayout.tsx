import type { ReactElement } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { PresencePanel } from '@/components/presence';
import { ConnectionStatus } from '@/components/connection';

interface IAppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: IAppLayoutProps): ReactElement => {
  return (
    <div data-testid='app-layout' className='flex h-svh flex-col overflow-hidden'>
      <header className='flex shrink-0 items-center justify-end gap-2 border-b border-border p-2'>
        <ConnectionStatus />
        <PresencePanel />
        <UserButton
          afterSignOutUrl='/'
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9',
            },
          }}
        />
      </header>
      <main className='min-h-0 flex-1'>{children}</main>
    </div>
  );
};
