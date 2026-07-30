/**
 * Multi-tab session state. Each tab is an independent query session. Tabs start
 * blank (no fabricated data); schema and results are populated only from a live
 * cluster once a query runs. Switching connections resets to a single fresh tab
 * (see useConnStore.setConn) so one session's data can never bleed into another.
 */

import { create } from "zustand";
import type { Group, SearchResult, TabSession } from "../lib/types";

let tabSeq = 0;
const nextId = () => `tab_${++tabSeq}`;

/** Deep clone for the (JSON-safe) query tree. */
const cloneQuery = (q: Group): Group => JSON.parse(JSON.stringify(q)) as Group;

/** Empty result placeholder for an un-run tab. */
const emptyResult = (): SearchResult => ({ total: 0, took: 0, hits: [], groupByField: null });

/** A single blank condition row (no field selected until a schema loads). */
const blankQuery = (): Group => ({
  type: "group",
  op: "AND",
  children: [{ type: "cond", field: "", ftype: "keyword", operator: "is", value: "" }],
});

/** Build a fresh, empty tab. Index is empty until the user picks one. */
export function freshTab(index = ""): TabSession {
  return {
    id: nextId(),
    index,
    view: "tree",
    jsonToggle: false,
    groupBy: null,
    mode: "normal",
    lookupId: "",
    foundId: null,
    pageSize: 25,
    page: 1,
    selected: new Set(),
    collapsed: new Set(),
    sorts: [{ field: "_score", dir: "desc" }],
    fields: [],
    query: blankQuery(),
    result: emptyResult(),
    loading: false,
  };
}

interface TabsState {
  tabs: TabSession[];
  activeTab: number;

  switchTab: (i: number) => void;
  newTab: () => void;
  closeTab: (i: number) => void;
  /** Discard all tabs back to a single fresh tab (used on connection switch). */
  resetTabs: () => void;

  /** Shallow-patch the active tab. */
  patchActive: (patch: Partial<TabSession>) => void;
  /** Patch a tab by id (used by async result writes). */
  patchById: (id: string, patch: Partial<TabSession>) => void;
  /** Mutate the active tab's query tree immutably. */
  mutateQuery: (fn: (q: Group) => void) => void;

  setResult: (id: string, result: SearchResult) => void;
  setLoading: (id: string, loading: boolean) => void;

  toggleSelected: (id: string) => void;
  setSelected: (sel: Set<string>) => void;
  clearSelected: () => void;
  toggleCollapsed: (path: string) => void;

  /** Switch the active tab to a different index, resetting derived state. */
  pickIndex: (name: string) => void;
}

export const useTabsStore = create<TabsState>((set) => ({
  tabs: [freshTab("")],
  activeTab: 0,

  switchTab: (i) => set((s) => (i === s.activeTab ? s : { activeTab: i })),

  newTab: () =>
    set((s) => {
      const nt = freshTab(s.tabs[s.activeTab]?.index ?? "");
      return { tabs: [...s.tabs, nt], activeTab: s.tabs.length };
    }),

  closeTab: (i) =>
    set((s) => {
      if (s.tabs.length <= 1) return s;
      const tabs = s.tabs.filter((_, idx) => idx !== i);
      let act = s.activeTab;
      if (i < act) act--;
      else if (i === act) act = Math.min(act, tabs.length - 1);
      return { tabs, activeTab: act };
    }),

  resetTabs: () => set({ tabs: [freshTab("")], activeTab: 0 }),

  patchActive: (patch) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => (idx === s.activeTab ? { ...t, ...patch } : t)),
    })),

  patchById: (id, patch) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  mutateQuery: (fn) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => {
        if (idx !== s.activeTab) return t;
        const q = cloneQuery(t.query);
        fn(q);
        return { ...t, query: q };
      }),
    })),

  setResult: (id, result) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, result } : t)),
    })),

  setLoading: (id, loading) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, loading } : t)),
    })),

  toggleSelected: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => {
        if (idx !== s.activeTab) return t;
        const sel = new Set(t.selected);
        if (sel.has(id)) sel.delete(id);
        else sel.add(id);
        return { ...t, selected: sel };
      }),
    })),

  setSelected: (sel) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => (idx === s.activeTab ? { ...t, selected: sel } : t)),
    })),

  clearSelected: () =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => (idx === s.activeTab ? { ...t, selected: new Set() } : t)),
    })),

  toggleCollapsed: (path) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) => {
        if (idx !== s.activeTab) return t;
        const c = new Set(t.collapsed);
        if (c.has(path)) c.delete(path);
        else c.add(path);
        return { ...t, collapsed: c };
      }),
    })),

  pickIndex: (name) =>
    set((s) => ({
      tabs: s.tabs.map((t, idx) =>
        idx === s.activeTab
          ? {
              ...t,
              index: name,
              schema: undefined,
              fields: [],
              sorts: [{ field: "_score", dir: "desc" }],
              groupBy: null,
              mode: "normal",
              selected: new Set(),
              collapsed: new Set(),
              page: 1,
              lookupId: "",
              foundId: null,
              query: blankQuery(),
              result: emptyResult(),
            }
          : t,
      ),
    })),
}));

/** Convenience selector hook for the active tab. */
export const useActiveTab = (): TabSession =>
  useTabsStore((s) => s.tabs[s.activeTab]);
