/** Top application bar (prototype: <header>). */

import { ClusterButton } from "../topbar/ClusterButton";
import { IndexSelector } from "../topbar/IndexSelector";
import { IdLookup } from "../topbar/IdLookup";
import { ThemeToggle } from "../topbar/ThemeToggle";

const kbd: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  border: "1px solid var(--border)",
  background: "var(--sunken)",
  borderRadius: 5,
  padding: "1px 6px",
  lineHeight: 1.5,
};

export function Header() {
  return (
    <header
      style={{
        height: 53,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "0 14px",
        background: "var(--panel)",
        borderBottom: "1px solid var(--border)",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 23,
            height: 23,
            borderRadius: 6,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-text)",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          e
        </div>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>Elastic Console</span>
      </div>

      <div style={{ width: 1, height: 24, background: "var(--border)" }} />

      <ClusterButton />
      <IndexSelector />
      <IdLookup />

      <div style={{ flex: 1 }} />

      <ThemeToggle />

      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--dim)", fontSize: 11 }}>
        <span style={kbd}>⌘</span>
        <span style={kbd}>↵</span>
        <span>run</span>
      </div>
    </header>
  );
}
