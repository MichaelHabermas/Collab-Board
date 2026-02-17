import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { SignInPage } from '@/pages/SignInPage';
import { authStore } from '@/store/authStore';

export const App = (): ReactElement => {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      authStore.getState().setUser(userId);
    } else {
      authStore.getState().clearUser();
    }
  }, [isSignedIn, userId]);

  if (!isLoaded) {
    return (
      <div data-testid='app-loading' className='flex min-h-svh items-center justify-center'>
        <span className='text-muted-foreground'>Loading…</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  return (
    <AppLayout>
      <div data-testid='app-root' className='flex flex-col items-center justify-center gap-4 p-4'>
        <h1 className='text-lg font-semibold text-foreground'>Collab Board</h1>
        <Button data-testid='shadcn-button-example'>Click me</Button>
      </div>
    </AppLayout>
  );
};
