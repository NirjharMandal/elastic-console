/** Group-by aggregation view: header + bucket bars (prototype: bucketHeader + renderBuckets). */

import { fmtNum } from "../../lib/format";
import { mix } from "../../theme/tokens";
import { RefreshButton } from "../topbar/RefreshButton";
import { resolveGroupFields } from "../../services/schema";
import { useActiveTab } from "../../stores/useTabsStore";

export function BucketsHeader() {
  const tab = useActiveTab();
  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtNum(tab.result.total)}</span>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>docs aggregated in</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--green)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {tab.result.took}ms
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "'IBM Plex Mono', monospace" }}>
        size: 0 · aggs only
      </span>
      <RefreshButton />
    </div>
  );
}

export function BucketsView() {
  const tab = useActiveTab();
  const gb = tab.groupBy || resolveGroupFields(tab)[1]?.[0] || "";
  const data = tab.result.buckets ?? [];
  const docCount = tab.result.docCount ?? tab.result.total;
  const max = data.length ? Math.max(...data.map((d) => d.count)) : 1;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          padding: "10px 12px",
          background: mix("var(--g2)", 8),
          border: `1px solid ${mix("var(--g2)", 28)}`,
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g2)" }}>Aggregation</span>
        <span style={{ fontSize: 12, color: "var(--dim)" }}>— terms on</span>
        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{gb}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{data.length} buckets · doc_count desc</span>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 9, background: "var(--panel)", padding: "4px 16px" }}>
        {data.map((b, i) => (
          <div
            key={b.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 4px",
              borderBottom: i < data.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                width: 150,
                flex: "none",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {b.key}
            </div>
            <div style={{ flex: 1, height: 24, background: "var(--sunken)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <div
                style={{
                  height: "100%",
                  width: (b.count / max) * 100 + "%",
                  background: mix("var(--g2)", 55, "var(--panel)"),
                  borderRadius: 6,
                  transition: "width .3s",
                }}
              />
            </div>
            <div style={{ width: 90, flex: "none", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtNum(b.count)}</span>
              <span style={{ fontSize: 11, color: "var(--faint)", marginLeft: 6 }}>
                {((b.count / docCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
