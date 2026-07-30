/**
 * Query execution orchestration. Builds DSL from the active tab (pure module),
 * routes through the data source (real Rust path or sample), writes the result
 * back to the tab, and auto-tracks history. Reads fresh store state at call time
 * to avoid stale closures.
 */

import { useCallback } from "react";
import { useTabsStore } from "../stores/useTabsStore";
import { useConnStore } from "../stores/useConnStore";
import { buildDsl } from "../lib/queryDsl";
import { describeQuery } from "../lib/queryDescribe";
import { runSearch } from "../services/source";
import { asEsError } from "../services/es";
import { insertHistory } from "../services/db";
import type { EsError } from "../lib/types";

export interface RunOptions {
  /** Reset to page 1 (default). Pager passes false to keep the current page. */
  resetPage?: boolean;
}

export function useRunQuery() {
  return useCallback((opts?: RunOptions) => {
    const tabsState = useTabsStore.getState();
    const tab = tabsState.tabs[tabsState.activeTab];
    if (!tab) return;
    const connState = useConnStore.getState();
    const conn =
      connState.connections.find((c) => c.id === connState.connId) ??
      connState.connections[0];

    const resetPage = opts?.resetPage ?? true;
    const page = resetPage ? 1 : tab.page;
    const dsl = buildDsl({
      query: tab.query,
      sorts: tab.sorts,
      pageSize: tab.pageSize,
      fields: tab.fields,
      groupBy: tab.groupBy,
      from: (page - 1) * tab.pageSize,
    });

    const id = tab.id;
    const groupBy = tab.groupBy;
    tabsState.setLoading(id, true);
    tabsState.patchById(id, { page, mode: groupBy ? "buckets" : "normal" });

    runSearch(conn, tab.index, dsl, groupBy)
      .then((res) => {
        tabsState.setResult(id, res);
        tabsState.patchById(id, {
          mode: res.error ? "error" : groupBy ? "buckets" : "normal",
        });
      })
      .catch((err) => {
        const esErr: EsError =
          asEsError(err) ?? {
            type: "client_error",
            reason: (err as Error)?.message ?? String(err),
            status: 0,
          };
        tabsState.setResult(id, { ...tab.result, error: esErr });
        tabsState.patchById(id, { mode: "error" });
      })
      .finally(() => tabsState.setLoading(id, false));

    void insertHistory(describeQuery(tab.query), "just now");
  }, []);
}
