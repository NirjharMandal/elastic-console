/**
 * UI shell state: theme (persisted, default light), sidebar width (persisted),
 * the shared anchored dropdown, the index typeahead menu, and overlay flags.
 */

import { create } from "zustand";
import type { ThemeName } from "../theme/tokens";
import { getSetting, saveSetting } from "../services/db";

export interface DdOption {
  v: string | number;
  label: string;
}

export interface DropdownState {
  key: string;
  rect: { left: number; top: number; width: number };
  options: DdOption[];
  onChange: (v: string | number) => void;
  value: string | number;
}

export interface IndexMenuState {
  left: number;
  top: number;
  width: number;
}

interface UiState {
  theme: ThemeName;
  sidebarWidth: number;
  savedOverlay: boolean;

  dd: DropdownState | null;
  idxMenu: IndexMenuState | null;
  idxSearch: string;

  hydrated: boolean;

  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setSidebarWidth: (w: number) => void;
  persistSidebarWidth: () => void;

  setSavedOverlay: (open: boolean) => void;

  openDropdown: (dd: DropdownState) => void;
  closeDropdown: () => void;

  openIdxMenu: (m: IndexMenuState) => void;
  closeIdxMenu: () => void;
  setIdxSearch: (s: string) => void;

  hydrate: () => Promise<void>;
}

const SIDEBAR_DEFAULT = 396;

export const useUiStore = create<UiState>((set, get) => ({
  theme: "light",
  sidebarWidth: SIDEBAR_DEFAULT,
  savedOverlay: false,

  dd: null,
  idxMenu: null,
  idxSearch: "",

  hydrated: false,

  setTheme: (t) => {
    set({ theme: t });
    void saveSetting("theme", t);
  },

  toggleTheme: () => {
    const t = get().theme === "dark" ? "light" : "dark";
    set({ theme: t });
    void saveSetting("theme", t);
  },

  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(320, Math.min(640, w)) }),
  persistSidebarWidth: () => void saveSetting("sidebarWidth", String(get().sidebarWidth)),

  setSavedOverlay: (open) => set({ savedOverlay: open }),

  openDropdown: (dd) => set({ dd }),
  closeDropdown: () => set({ dd: null }),

  openIdxMenu: (m) => set({ idxMenu: m, idxSearch: "" }),
  closeIdxMenu: () => set({ idxMenu: null }),
  setIdxSearch: (s) => set({ idxSearch: s }),

  hydrate: async () => {
    const [theme, sidebarWidth] = await Promise.all([
      getSetting("theme"),
      getSetting("sidebarWidth"),
    ]);
    set({
      theme: theme === "dark" || theme === "light" ? theme : "light",
      sidebarWidth: sidebarWidth ? Number(sidebarWidth) || SIDEBAR_DEFAULT : SIDEBAR_DEFAULT,
      hydrated: true,
    });
  },
}));
