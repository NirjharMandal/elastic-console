/**
 * Live-cluster index + schema integration. On a real connection these fetch the
 * cluster's actual indices (for the selector) and a picked index's field-caps
 * (for the builder). On sample/no-Tauri they no-op and the UI uses sample data.
 */

import { useCallback, useEffect } from "react";
import { useActiveConn, useConnStore } from "../stores/useConnStore";
import { useTabsStore } from "../stores/useTabsStore";
import { useUiStore } from "../stores/useUiStore";
import { esFieldCaps, hasTauri } from "../services/es";
import { listIndices } from "../services/source";
import { firstQueryField } from "../services/schema";

/** Lazily load the active real connection's indices when the index menu opens. */
export function useEnsureLiveIndices() {
  const conn = useActiveConn();
  const menuOpen = useUiStore((s) => s.idxMenu != null);
  const liveIndices = useConnStore((s) => s.liveIndices);
  const loading = useConnStore((s) => s.loadingIndices);
  const setLive = useConnStore((s) => s.setLiveIndices);
  const setLoading = useConnStore((s) => s.setLoadingIndices);

  useEffect(() => {
    if (!menuOpen || !conn || !hasTauri()) return;
    if (liveIndices !== null || loading) return;
    setLoading(true);
    listIndices(conn)
      .then((list) => setLive(list))
      .catch(() => setLive([]))
      .finally(() => setLoading(false));
  }, [menuOpen, conn, liveIndices, loading, setLive, setLoading]);
}

/** Pick an index: immediate sample reset, then live field-caps for real clusters. */
export function usePickIndex() {
  const conn = useActiveConn();

  return useCallback(
    (name: string) => {
      const st = useTabsStore.getState();
      const tabId = st.tabs[st.activeTab].id;
      st.pickIndex(name);

      if (conn && hasTauri()) {
        esFieldCaps(conn, name)
          .then((fields) => {
            if (!fields.length) return;
            const first = firstQueryField(fields);
            if (!first) return;
            useTabsStore.getState().patchById(tabId, {
              schema: fields,
              // Default to ALL fields selected (including nested) per product spec.
              fields: fields.map((f) => f.f),
              sorts: [{ field: "_score", dir: "desc" }],
              groupBy: null,
              query: {
                type: "group",
                op: "AND",
                children: [
                  { type: "cond", field: first.f, ftype: first.t, operator: "is", value: "" },
                ],
              },
            });
          })
          .catch(() => {});
      }
    },
    [conn],
  );
}
