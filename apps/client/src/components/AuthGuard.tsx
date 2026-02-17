import type { ReactElement, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SignInPage } from '@/pages/SignInPage';

interface IAuthGuardProps {
  children: ReactNode;
}

/**
 * Wraps content that requires authentication.
 * Shows loading while Clerk initializes, redirects to sign-in when not signed in, otherwise renders children.
 */
export const AuthGuard = ({ children }: IAuthGuardProps): ReactElement => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div data-testid='auth-guard-loading' className='flex min-h-svh items-center justify-center'>
        <span className='text-muted-foreground'>Loading…</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  return <>{children}</>;
};
