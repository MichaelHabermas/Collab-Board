import { create } from 'zustand';

interface IAuthState {
  userId: string;
  isSignedIn: boolean;
  setUser: (userId: string) => void;
  clearUser: () => void;
}

const initialState = {
  userId: '',
  isSignedIn: false,
};

export const authStore = create<IAuthState>((set) => ({
  ...initialState,
  setUser: (userId: string) => {
    set({ userId, isSignedIn: true });
  },
  clearUser: () => {
    set(initialState);
  },
}));
