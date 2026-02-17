import type { ReactElement } from 'react';
import { UserButton } from '@clerk/clerk-react';

interface IAppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: IAppLayoutProps): ReactElement => {
  return (
    <div data-testid='app-layout' className='flex min-h-svh flex-col'>
      <header className='flex shrink-0 items-center justify-end border-b border-border p-2'>
        <UserButton
          afterSignOutUrl='/'
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9',
            },
          }}
        />
      </header>
      <main className='flex-1'>{children}</main>
    </div>
  );
};
