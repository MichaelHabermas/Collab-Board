import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppLayout } from '@/components/AppLayout';
import { InfiniteCanvas } from '@/components/canvas';
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
        <div data-testid='app-root' className='flex min-h-0 flex-1 flex-col'>
          <InfiniteCanvas />
        </div>
      </AppLayout>
    </AuthGuard>
  );
};
