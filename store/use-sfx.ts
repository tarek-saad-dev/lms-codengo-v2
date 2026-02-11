import { create } from "zustand";
import { persist } from "zustand/middleware";

type SfxStore = {
  muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
};

/**
 * Global SFX Mute Store
 * 
 * Persists mute state in localStorage
 * Default: not muted
 */
export const useSfxStore = create<SfxStore>()(
  persist(
    (set) => ({
      muted: false,
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      setMuted: (muted: boolean) => set({ muted }),
    }),
    {
      name: "sfxMuted",
    }
  )
);
