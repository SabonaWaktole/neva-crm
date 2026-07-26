import { create } from 'zustand';

export type Role = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF';

export interface User {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: Role;
  tenantId: string | null;
  tenantSlug: string | null;
  warehouseId?: string | null;
  /**
   * Profile and workspace media, returned by GET /auth/me. Held on the auth
   * user so the sidebar and header can render branding without their own
   * fetch. All optional — an account may simply have no image set.
   */
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  tenantName?: string | null;
  tenantLogoUrl?: string | null;
  tenantCoverImageUrl?: string | null;
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
