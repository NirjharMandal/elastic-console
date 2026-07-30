/** Independent-session tab strip (prototype: renderTabStrip). */

import { countConditions } from "../../lib/queryDsl";
import { useTabsStore } from "../../stores/useTabsStore";
import type { TabSession } from "../../lib/types";

const dotColor = (index: string): string =>
  index === "users" ? "var(--blue)" : index === "orders" ? "var(--g1)" : "var(--g2)";

export function TabStrip() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTab = useTabsStore((s) => s.activeTab);
  const switchTab = useTabsStore((s) => s.switchTab);
  const newTab = useTabsStore((s) => s.newTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const multi = tabs.length > 1;

  const renderTab = (t: TabSession, i: number) => {
    const active = i === activeTab;
    const n = countConditions(t.query);
    return (
      <div
        key={t.id}
        onClick={() => switchTab(i)}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = "var(--hover)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 9px 0 12px",
          height: 33,
          cursor: "pointer",
          borderRight: "1px solid var(--border)",
          background: active ? "var(--bg)" : "transparent",
          color: active ? "var(--text)" : "var(--dim)",
          position: "relative",
          whiteSpace: "nowrap",
          maxWidth: 210,
          transition: "background .12s",
        }}
      >
        {active && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent)" }} />
        )}
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor(t.index), flex: "none" }} />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12.5,
            fontWeight: active ? 600 : 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t.index}
        </span>
        {t.groupBy && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--g2)",
              fontFamily: "'IBM Plex Mono', monospace",
              lineHeight: 1,
            }}
          >
            Σ
          </span>
        )}
        {n > 0 && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--faint)",
              background: "var(--sunken)",
              borderRadius: 9,
              padding: "1px 6px",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {n}
          </span>
        )}
        {multi && (
          <span
            title="close tab"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(i);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--sunken)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--faint)";
            }}
            style={{
              marginLeft: 2,
              width: 17,
              height: 17,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--faint)",
              fontSize: 13,
              lineHeight: 1,
            }}
          >
            ×
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        height: 34,
        flex: "none",
        display: "flex",
        alignItems: "stretch",
        background: "var(--panel)",
        borderBottom: "1px solid var(--border)",
        overflowX: "auto",
        zIndex: 4,
      }}
    >
      {tabs.map(renderTab)}
      <button
        type="button"
        onClick={newTab}
        title="New query tab"
        style={{
          width: 36,
          flex: "none",
          background: "transparent",
          border: "none",
          borderRight: "1px solid var(--border)",
          color: "var(--dim)",
          cursor: "pointer",
          fontSize: 17,
          lineHeight: 1,
        }}
      >
        +
      </button>
      <div
        style={{
          flex: 1,
          minWidth: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 14,
        }}
      >
        <span style={{ fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>
          {tabs.length} open · each tab is an independent session
        </span>
      </div>
    </div>
  );
}
