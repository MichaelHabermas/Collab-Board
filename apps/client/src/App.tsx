import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { AuthGuard } from '@/components/AuthGuard';
import { SocketProvider } from '@/context/SocketContext';
import { AppLayout } from '@/components/AppLayout';
import { InfiniteCanvas } from '@/components/canvas';
import { Toolbar } from '@/components/toolbar';
import { authStore } from '@/store/authStore';
import { useBoardSettingsPersistence } from '@/hooks/useBoardSettingsPersistence';

export const App = (): ReactElement => {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useBoardSettingsPersistence();

  useEffect(() => {
    if (isSignedIn && userId) {
      const displayName =
        user?.fullName ??
        user?.firstName ??
        (user?.primaryEmailAddress?.emailAddress ?? '').split('@')[0] ??
        '';
      const avatarUrl = user?.imageUrl ?? '';
      authStore.getState().setUser(userId, displayName, avatarUrl);
    } else {
      authStore.getState().clearUser();
    }
  }, [
    isSignedIn,
    userId,
    user?.fullName,
    user?.firstName,
    user?.primaryEmailAddress?.emailAddress,
    user?.imageUrl,
  ]);

  return (
    <AuthGuard>
      <SocketProvider>
        <AppLayout>
          <div data-testid='app-root' className='flex h-full min-h-0 flex-1 flex-row'>
            <Toolbar />
            <div
              className='relative h-full min-h-0 min-w-0 flex-1'
              data-testid='canvas-column-wrapper'
            >
              <div className='absolute inset-0'>
                <InfiniteCanvas />
              </div>
            </div>
          </div>
        </AppLayout>
      </SocketProvider>
    </AuthGuard>
  );
};
