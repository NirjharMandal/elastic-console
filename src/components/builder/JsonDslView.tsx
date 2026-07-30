/** Read-only, copyable generated Elasticsearch DSL (prototype: jsonToggle view). */

import { useMemo } from "react";
import { JsonLines } from "../results/JsonLines";
import { buildDsl } from "../../lib/queryDsl";
import { flattenJson } from "../../lib/jsonModel";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";

export function JsonDslView() {
  const tab = useActiveTab();
  const toggleCollapsed = useTabsStore((s) => s.toggleCollapsed);

  const dsl = useMemo(
    () =>
      buildDsl({
        query: tab.query,
        sorts: tab.sorts,
        pageSize: tab.pageSize,
        fields: tab.fields,
        groupBy: tab.groupBy,
      }),
    [tab.query, tab.sorts, tab.pageSize, tab.fields, tab.groupBy],
  );

  const rows = useMemo(
    () => flattenJson(dsl, "dsl", null, { collapsed: tab.collapsed, annotateTime: false }),
    [dsl, tab.collapsed],
  );

  const copy = () => {
    try {
      void navigator.clipboard.writeText(JSON.stringify(dsl, null, 2));
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "var(--sunken)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 12px",
        overflowX: "auto",
      }}
    >
      <button
        type="button"
        onClick={copy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--dim)",
          background: "var(--elev)",
          border: "1px solid var(--border)",
          borderRadius: 5,
          padding: "3px 8px",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        Copy
      </button>
      <JsonLines rows={rows} onToggle={toggleCollapsed} />
    </div>
  );
}
