import type { ReactElement, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { App } from './App';

let mockAuthState = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_123',
  getToken: async (): Promise<string | null> => 'mock-token',
  signOut: async (): Promise<void> => undefined,
};

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockAuthState,
  ClerkProvider: ({ children }: { children: ReactNode }): ReactElement => <>{children}</>,
  SignIn: (): ReactElement => <div data-testid='sign-in-mock'>Sign In</div>,
  UserButton: (): ReactElement => <div data-testid='user-button-mock'>UserButton</div>,
}));

describe('App', () => {
  it('renders app root and example button when signed in', () => {
    mockAuthState = {
      ...mockAuthState,
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
    };
    render(<App />);
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
    expect(screen.getByTestId('shadcn-button-example')).toHaveTextContent('Click me');
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders sign-in page when signed out', () => {
    mockAuthState = {
      ...mockAuthState,
      isLoaded: true,
      isSignedIn: false,
      userId: '',
    };
    render(<App />);
    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-mock')).toBeInTheDocument();
  });

  it('renders loading state when auth is not loaded', () => {
    mockAuthState = {
      ...mockAuthState,
      isLoaded: false,
      isSignedIn: false,
      userId: '',
    };
    render(<App />);
    expect(screen.getByTestId('auth-guard-loading')).toBeInTheDocument();
  });
});
