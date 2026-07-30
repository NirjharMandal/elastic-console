/** _id lookup miss state (prototype: renderNotFound). */

import type { CSSProperties } from "react";
import { useActiveTab } from "../../stores/useTabsStore";

const code: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  background: "var(--sunken)",
  padding: "2px 6px",
  borderRadius: 5,
  color: "var(--text)",
};

function KV({ k, v, color }: { k: string; v: string; color: string }) {
  return (
    <div>
      <span style={{ color: "var(--jkey)" }}>{k}</span>
      <span style={{ color: "var(--jpunc)" }}>: </span>
      <span style={{ color }}>{v}</span>
    </div>
  );
}

export function NotFound() {
  const tab = useActiveTab();
  return (
    <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: 22,
          color: "var(--faint)",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        ∅
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No document found</div>
      <div style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 18, lineHeight: 1.6 }}>
        No document matches _id <code style={code}>{tab.lookupId || "—"}</code> in index{" "}
        <code style={code}>{tab.index}</code>.
      </div>
      <div
        style={{
          display: "inline-block",
          textAlign: "left",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "12px 14px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
        }}
      >
        <KV k='"found"' v="false" color="var(--jbool)" />
        <KV k='"_index"' v={`"${tab.index}"`} color="var(--jstr)" />
        <KV k='"_id"' v={`"${tab.lookupId || ""}"`} color="var(--jstr)" />
      </div>
    </div>
  );
}
