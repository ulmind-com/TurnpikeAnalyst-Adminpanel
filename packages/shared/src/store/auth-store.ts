import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORAGE_KEYS } from "@turnpike/shared/constants/config";
import type { UserResponse, UserRole } from "@turnpike/shared/types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  hydrated: boolean;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user?: UserResponse | null;
  }) => void;
  setTokens: (payload: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: UserResponse | null) => void;
  clear: () => void;
  setHydrated: () => void;
}

const memoryStorage: Storage = {
  length: 0,
  clear: () => undefined,
  key: () => null,
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const safeStorage = () => (typeof window === "undefined" ? memoryStorage : window.localStorage);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: user ?? state.user,
        })),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(safeStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Non-reactive accessors used by the axios interceptors. */
export const authTokens = {
  get access() {
    return useAuthStore.getState().accessToken;
  },
  get refresh() {
    return useAuthStore.getState().refreshToken;
  },
};

export const hasRole = (user: UserResponse | null | undefined, roles: UserRole[]) =>
  !!user?.role && roles.includes(user.role);
