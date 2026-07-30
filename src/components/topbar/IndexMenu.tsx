/** Floating index typeahead menu (prototype: renderIndexMenu). */

import { fmtNum } from "../../lib/format";
import { effectiveIndices } from "../../services/schema";
import { useConnStore } from "../../stores/useConnStore";
import { useActiveTab } from "../../stores/useTabsStore";
import { useUiStore } from "../../stores/useUiStore";
import { useEnsureLiveIndices, usePickIndex } from "../../hooks/useIndices";

export function IndexMenu() {
  const menu = useUiStore((s) => s.idxMenu);
  const search = useUiStore((s) => s.idxSearch);
  const setSearch = useUiStore((s) => s.setIdxSearch);
  const close = useUiStore((s) => s.closeIdxMenu);
  const curIndex = useActiveTab().index;
  const liveIndices = useConnStore((s) => s.liveIndices);
  const loadingIndices = useConnStore((s) => s.loadingIndices);
  const pickIndex = usePickIndex();
  useEnsureLiveIndices();

  if (!menu) return null;
  const list = effectiveIndices(liveIndices).filter((i) =>
    i.name.includes(search.toLowerCase()),
  );

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
      <div
        className="om-fade-fast"
        style={{
          position: "fixed",
          left: menu.left,
          top: menu.top + 5,
          width: Math.max(menu.width, 272),
          background: "var(--elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 10,
          boxShadow: "0 14px 38px rgba(0,0,0,0.32)",
          zIndex: 71,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 8, borderBottom: "1px solid var(--border)" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indices…"
            style={{
              width: "100%",
              background: "var(--sunken)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: 6,
              padding: "7px 10px",
              font: "inherit",
              fontSize: 12.5,
              fontFamily: "'IBM Plex Mono', monospace",
              outline: "none",
            }}
          />
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", padding: 4 }}>
          {loadingIndices && (
            <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>
              Loading cluster indices…
            </div>
          )}
          {list.length ? (
            list.map((it) => {
              const active = it.name === curIndex;
              const clickable = it.hasSchema;
              return (
                <div
                  key={it.name}
                  onClick={clickable ? () => { pickIndex(it.name); close(); } : undefined}
                  onMouseEnter={(e) => {
                    if (clickable && !active) e.currentTarget.style.background = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 7,
                    cursor: clickable ? "pointer" : "default",
                    background: active ? "var(--accent-soft)" : "transparent",
                    opacity: clickable ? 1 : 0.55,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      flex: 1,
                    }}
                  >
                    {it.name}
                  </span>
                  {clickable ? (
                    <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {fmtNum(it.docs)} docs
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--faint)", fontStyle: "italic" }}>
                      no schema cached
                    </span>
                  )}
                  {active && <span style={{ fontSize: 12, color: "var(--green)", marginLeft: 4 }}>✓</span>}
                </div>
              );
            })
          ) : (
            <div style={{ padding: 16, textAlign: "center", color: "var(--faint)", fontSize: 12 }}>
              No matching indices
            </div>
          )}
        </div>
      </div>
    </>
  );
}
