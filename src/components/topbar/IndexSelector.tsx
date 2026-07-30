/** Index selector button (prototype: renderIndexSelector). */

import { fmtNum } from "../../lib/format";
import { effectiveIndices } from "../../services/schema";
import { useConnStore } from "../../stores/useConnStore";
import { useActiveTab } from "../../stores/useTabsStore";
import { useUiStore } from "../../stores/useUiStore";

export function IndexSelector() {
  const idx = useActiveTab().index;
  const liveIndices = useConnStore((s) => s.liveIndices);
  const openIdxMenu = useUiStore((s) => s.openIdxMenu);

  const meta = effectiveIndices(liveIndices).find((i) => i.name === idx);

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        openIdxMenu({ left: r.left, top: r.bottom, width: r.width });
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
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
          fontSize: 10,
          color: "var(--faint)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        index
      </span>
      <span
        style={{
          fontWeight: 600,
          fontSize: 12.5,
          fontFamily: "'IBM Plex Mono', monospace",
          color: idx ? "var(--text)" : "var(--faint)",
        }}
      >
        {idx || "select…"}
      </span>
      {meta && (
        <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtNum(meta.docs)}
        </span>
      )}
      <span style={{ color: "var(--faint)", fontSize: 8 }}>▾</span>
    </button>
  );
}
