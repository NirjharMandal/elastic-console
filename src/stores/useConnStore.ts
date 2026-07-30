/**
 * Connection manager state. Holds connection *metadata* only — secrets live in
 * the macOS Keychain (handled by the ConnectionsModal via services/es.ts).
 * Metadata is persisted to SQLite; this store stays I/O-light and degrades
 * gracefully when not under Tauri.
 */

import { create } from "zustand";
import type { Connection, ConnectionDraft, Health } from "../lib/types";
import type { IndexInfo } from "../services/es";
import { useTabsStore } from "./useTabsStore";
import {
  deleteConnectionRow,
  getSetting,
  listConnections,
  saveSetting,
  upsertConnection,
} from "../services/db";

export interface TestingState {
  id: string;
  status: "testing" | "ok" | "fail";
  ms?: number;
  message?: string;
}

const blankDraft = (): ConnectionDraft => ({
  id: "",
  name: "",
  label: "",
  host: "https://",
  auth: "apikey",
  user: "",
  env: "dev",
});

/** Outcome of a connection-form save (so the UI can surface persistence errors). */
export interface SaveResult {
  ok: boolean;
  saved?: Connection;
  error?: string;
}

interface ConnState {
  connections: Connection[];
  connId: string;
  connOverlay: boolean;
  connForm: ConnectionDraft | null;
  testing: TestingState | null;
  /** Live indices for the active real connection (null = not loaded / use sample). */
  liveIndices: IndexInfo[] | null;
  loadingIndices: boolean;

  setConn: (id: string) => void;
  setLiveIndices: (list: IndexInfo[] | null) => void;
  setLoadingIndices: (loading: boolean) => void;
  setConnOverlay: (open: boolean) => void;
  openConnForm: (conn?: Connection | null) => void;
  closeConnForm: () => void;
  setForm: (patch: Partial<ConnectionDraft>) => void;
  /** Persist the form's metadata to SQLite, then report success/failure. */
  saveConnForm: () => Promise<SaveResult>;
  deleteConn: (id: string) => void;
  setTesting: (t: TestingState | null) => void;
  setHealth: (id: string, health: Health, version?: string, nodes?: number) => void;

  hydrate: () => Promise<void>;
}

export const useConnStore = create<ConnState>((set, get) => ({
  connections: [],
  connId: "",
  connOverlay: false,
  connForm: null,
  testing: null,
  liveIndices: null,
  loadingIndices: false,

  setConn: (id) => {
    if (id === get().connId) {
      set({ connOverlay: false });
      return;
    }
    // Switching sessions: drop the previous connection's tabs so no stale data
    // bleeds across, and clear cached live indices for the new cluster.
    set({ connId: id, connOverlay: false, liveIndices: null, loadingIndices: false });
    useTabsStore.getState().resetTabs();
    void saveSetting("activeConn", id);
  },

  setLiveIndices: (list) => set({ liveIndices: list }),
  setLoadingIndices: (loading) => set({ loadingIndices: loading }),

  setConnOverlay: (open) =>
    set(open ? { connOverlay: true, connForm: null, testing: null } : { connOverlay: false, connForm: null }),

  openConnForm: (conn) =>
    set({ connForm: conn ? { ...blankDraft(), ...conn } : blankDraft(), testing: null }),

  closeConnForm: () => set({ connForm: null, testing: null }),

  setForm: (patch) =>
    set((s) => (s.connForm ? { connForm: { ...s.connForm, ...patch } } : s)),

  saveConnForm: async () => {
    const f = get().connForm;
    if (!f) return { ok: false };
    const conns = get().connections.slice();
    let saved: Connection;
    if (f.id) {
      const i = conns.findIndex((c) => c.id === f.id);
      const prev = i >= 0 ? conns[i] : null;
      saved = {
        health: "unknown",
        version: "",
        nodes: 0,
        indexNames: [],
        ...(prev ?? {}),
        id: f.id,
        name: f.name,
        label: f.label,
        host: f.host,
        auth: f.auth,
        user: f.user,
        env: f.env,
      };
      if (i >= 0) conns[i] = saved;
      else conns.push(saved);
    } else {
      const id = "c" + Math.abs(hashStr(f.label + f.host)).toString(36).slice(0, 6);
      saved = {
        id,
        name: f.name || "new-connection",
        label: f.label,
        host: f.host,
        auth: f.auth,
        user: f.user,
        env: f.env,
        health: "unknown",
        version: "",
        nodes: 0,
        indexNames: [],
      };
      conns.push(saved);
    }
    // Persist to SQLite FIRST; only commit to in-memory state if it actually saved,
    // so a write failure surfaces instead of silently losing data on restart.
    try {
      await upsertConnection(saved);
    } catch (e) {
      return { ok: false, error: (e as Error)?.message ?? "Could not save the connection to the local database." };
    }
    set({ connections: conns });
    return { ok: true, saved };
  },

  deleteConn: (id) => {
    const wasActive = get().connId === id;
    const conns = get().connections.filter((c) => c.id !== id);
    const connId = wasActive ? conns[0]?.id ?? "" : get().connId;
    set({ connections: conns, connId, liveIndices: wasActive ? null : get().liveIndices });
    if (wasActive) {
      // The active session went away — start clean on whatever remains (if anything).
      useTabsStore.getState().resetTabs();
      void saveSetting("activeConn", connId);
    }
    void deleteConnectionRow(id);
  },

  setTesting: (t) => set({ testing: t }),

  setHealth: (id, health, version, nodes) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id
          ? { ...c, health, version: version ?? c.version, nodes: nodes ?? c.nodes }
          : c,
      ),
    })),

  hydrate: async () => {
    const [rows, activeConn] = await Promise.all([
      listConnections(),
      getSetting("activeConn"),
    ]);
    if (rows && rows.length > 0) {
      const connId = activeConn && rows.some((r) => r.id === activeConn) ? activeConn : rows[0].id;
      set({ connections: rows, connId });
    } else if (activeConn) {
      set({ connId: activeConn });
    }
  },
}));

/** Active connection selector; undefined when no connection exists. */
export const useActiveConn = (): Connection | undefined => {
  const connections = useConnStore((s) => s.connections);
  const connId = useConnStore((s) => s.connId);
  return connections.find((c) => c.id === connId) ?? connections[0];
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}
