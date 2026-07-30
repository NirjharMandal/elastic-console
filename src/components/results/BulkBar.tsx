/** Bulk-selection action bar (prototype: bulkBar). */

import type { CSSProperties } from "react";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";

const actBtn: CSSProperties = {
  background: "color-mix(in srgb, var(--accent-text) 16%, transparent)",
  color: "var(--accent-text)",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export function BulkBar() {
  const tab = useActiveTab();
  const selected = tab.selected;
  const clearSelected = useTabsStore((s) => s.clearSelected);
  if (selected.size === 0) return null;

  const docs = tab.result.hits.filter((h) => selected.has(h._id));

  const copyAll = () => {
    try {
      void navigator.clipboard.writeText(JSON.stringify(docs, null, 2));
    } catch {
      /* clipboard unavailable */
    }
  };

  const exportSel = () => {
    const blob = new Blob([JSON.stringify(docs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab.index}-selection-${docs.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--accent)",
        color: "var(--accent-text)",
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{selected.size} selected</span>
      <div style={{ flex: 1 }} />
      <button type="button" style={actBtn} onClick={copyAll}>
        Copy all JSON
      </button>
      <button type="button" style={actBtn} onClick={exportSel}>
        Export selection
      </button>
      <button
        type="button"
        onClick={clearSelected}
        style={{
          background: "transparent",
          color: "var(--accent-text)",
          border: "none",
          borderRadius: 6,
          padding: "6px 8px",
          font: "inherit",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          opacity: 0.75,
        }}
      >
        Clear
      </button>
    </div>
  );
}
