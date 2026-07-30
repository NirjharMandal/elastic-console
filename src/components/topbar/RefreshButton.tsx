/**
 * Manual session refresh. Re-syncs the active connection's cluster health and
 * index list, then re-runs the current tab's query so the displayed results
 * match the live cluster. A recovery action for when a session looks stale.
 */

import { useState } from "react";
import { useActiveConn, useConnStore } from "../../stores/useConnStore";
import { useRunQuery } from "../../hooks/useRunQuery";
import { clusterHealth, listIndices } from "../../services/source";

export function RefreshButton() {
  const conn = useActiveConn();
  const setLiveIndices = useConnStore((s) => s.setLiveIndices);
  const setLoadingIndices = useConnStore((s) => s.setLoadingIndices);
  const setHealth = useConnStore((s) => s.setHealth);
  const run = useRunQuery();
  const [busy, setBusy] = useState(false);

  const disabled = !conn || busy;

  const refresh = async () => {
    if (!conn || busy) return;
    setBusy(true);
    setLoadingIndices(true);
    try {
      const [health, indices] = await Promise.all([
        clusterHealth(conn),
        listIndices(conn),
      ]);
      if (health) setHealth(conn.id, health.health, health.version, health.nodes);
      setLiveIndices(indices);
      // Re-run the current tab's query against the (re-synced) cluster.
      run({ resetPage: false });
    } finally {
      setLoadingIndices(false);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      title={conn ? "Refresh — re-sync this session with the cluster" : "No active connection"}
      onClick={() => void refresh()}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        border: "1px solid var(--border)",
        borderRadius: 7,
        background: "var(--elev)",
        color: "var(--dim)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        font: "inherit",
        fontSize: 14,
        transition: "border-color .12s",
      }}
    >
      <span className={busy ? "om-spin" : undefined} style={{ display: "inline-block", lineHeight: 1 }}>
        ↻
      </span>
    </button>
  );
}
