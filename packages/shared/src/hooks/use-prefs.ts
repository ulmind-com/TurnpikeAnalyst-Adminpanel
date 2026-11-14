import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PrefsState {
  dark: boolean;
  reducedMotion: boolean;
  smoothScroll: boolean;
  customCursor: boolean;
  setPref: <K extends keyof Omit<PrefsState, "setPref">>(key: K, value: PrefsState[K]) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      dark: false,
      reducedMotion: false,
      smoothScroll: true,
      customCursor: true,
      setPref: (key, value) => set({ [key]: value }),
    }),
    {
      name: "turnpike.prefs.v1",
    }
  )
);
