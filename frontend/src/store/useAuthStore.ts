import { create } from 'zustand';

export type Role = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF';

export interface User {
  userId: string;
  role: Role;
  tenantId: string | null;
  tenantSlug: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  
  setUser: (user: User | null) => void;
  logout: () => void;
  setInitializing: (isInitializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true, // starts true until we check /me on app load

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setInitializing: (isInitializing) => set({ isInitializing }),
}));
