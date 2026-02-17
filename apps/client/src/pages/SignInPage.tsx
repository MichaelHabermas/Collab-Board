import type { ReactElement } from 'react';
import { SignIn } from '@clerk/clerk-react';

export const SignInPage = (): ReactElement => {
  return (
    <div
      data-testid='sign-in-page'
      className='flex min-h-svh flex-col items-center justify-center p-4'
    >
      <SignIn fallbackRedirectUrl='/' />
    </div>
  );
};
