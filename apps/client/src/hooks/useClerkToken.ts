import { useAuth } from '@clerk/clerk-react';

/**
 * Returns getToken from Clerk for use with Socket.io and REST (Authorization header).
 * Use getToken() to obtain a JWT for the current session.
 */
export const useClerkToken = (): (() => Promise<string | null>) => {
  const { getToken } = useAuth();
  return getToken;
};
