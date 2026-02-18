import { create } from 'zustand';

interface IAuthState {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isSignedIn: boolean;
  setUser: (userId: string, displayName?: string, avatarUrl?: string) => void;
  clearUser: () => void;
}

const initialState = {
  userId: '',
  displayName: '',
  avatarUrl: '',
  isSignedIn: false,
};

export const authStore = create<IAuthState>((set) => ({
  ...initialState,
  setUser: (userId: string, displayName = '', avatarUrl = '') => {
    set({ userId, displayName, avatarUrl, isSignedIn: true });
  },
  clearUser: () => {
    set(initialState);
  },
}));
