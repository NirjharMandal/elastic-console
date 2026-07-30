/** Cluster status indicator + connection-manager opener (prototype: renderClusterBtn). */

import { ENV_COLOR, HEALTH_COLOR, mix } from "../../theme/tokens";
import { useActiveConn, useConnStore } from "../../stores/useConnStore";

export function ClusterButton() {
  const conn = useActiveConn();
  const openOverlay = useConnStore((s) => s.setConnOverlay);

  if (!conn) {
    return (
      <button
        type="button"
        title="Manage connections"
        onClick={() => openOverlay(true)}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 11px",
          border: "1px dashed var(--border-strong)",
          borderRadius: 8,
          background: "var(--elev)",
          cursor: "pointer",
          color: "var(--dim)",
          font: "inherit",
          fontSize: 12,
          fontWeight: 600,
          transition: "border-color .12s",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--faint)", flex: "none" }} />
        Connect cluster
        <span style={{ color: "var(--faint)", fontSize: 8, marginLeft: 1 }}>▾</span>
      </button>
    );
  }

  const hc = HEALTH_COLOR[conn.health] ?? "var(--faint)";
  const ec = ENV_COLOR[conn.env] ?? "var(--dim)";

  return (
    <button
      type="button"
      title="Manage connections"
      onClick={() => openOverlay(true)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 9px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "var(--elev)",
        cursor: "pointer",
        color: "var(--text)",
        font: "inherit",
        transition: "border-color .12s",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: hc,
          boxShadow: `0 0 0 3px ${mix(hc, 22)}`,
          flex: "none",
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
        {conn.name}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: ec,
          background: mix(ec, 13),
          border: `1px solid ${mix(ec, 30)}`,
          borderRadius: 4,
          padding: "1px 5px",
        }}
      >
        {conn.env}
      </span>
      <span style={{ color: "var(--faint)", fontSize: 8, marginLeft: 1 }}>▾</span>
    </button>
  );
}
