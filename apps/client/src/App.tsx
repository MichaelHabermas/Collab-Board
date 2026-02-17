import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppLayout } from '@/components/AppLayout';
import { InfiniteCanvas } from '@/components/canvas';
import { Toolbar } from '@/components/toolbar';
import { authStore } from '@/store/authStore';

export const App = (): ReactElement => {
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      authStore.getState().setUser(userId);
    } else {
      authStore.getState().clearUser();
    }
  }, [isSignedIn, userId]);

  return (
    <AuthGuard>
      <AppLayout>
        <div data-testid='app-root' className='flex h-full min-h-0 flex-1 flex-row'>
          <Toolbar />
          <div className='relative h-full min-h-0 min-w-0 flex-1' data-testid='canvas-column-wrapper'>
            <div className='absolute inset-0'>
              <InfiniteCanvas />
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};
