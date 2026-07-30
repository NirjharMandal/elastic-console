/**
 * Flat table view, virtualized with react-window so large result pages scroll
 * smoothly (prototype: renderTable). Detected timestamp cells show a compact
 * "🕐 relative" with the absolute time on hover; the JSON tree shows both inline.
 */

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { fmtNum, gv, tsAnnotate } from "../../lib/format";
import { useElementSize } from "../../hooks/useElementSize";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import type { Hit } from "../../lib/types";

const ROW_H = 33;
const HEADER_H = 34;
const CB_W = 34;
const ID_W = 150;
const COL_W = 170;

interface RowData {
  docs: Hit[];
  cols: string[];
  widths: number[];
  selected: Set<string>;
  toggle: (id: string) => void;
}

const headCell: CSSProperties = {
  padding: "9px 12px",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--faint)",
  whiteSpace: "nowrap",
  flex: "none",
  display: "flex",
  alignItems: "center",
};

function Cell({ doc, col, width }: { doc: Hit; col: string; width: number }) {
  const raw = gv(doc._source, col);
  const isNum = typeof raw === "number";
  const display = raw;
  const ts = tsAnnotate(raw);

  return (
    <div
      style={{
        width,
        flex: "none",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: isNum ? "var(--jnum)" : "var(--text)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {raw == null ? (
        <span style={{ color: "var(--faint)" }}>—</span>
      ) : (
        <span>{String(display)}</span>
      )}
      {ts && (
        <span
          title={ts.absolute}
          style={{ color: "var(--faint)", fontStyle: "italic", fontSize: 11, whiteSpace: "nowrap" }}
        >
          🕐 {ts.relative}
        </span>
      )}
    </div>
  );
}

function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const { docs, cols, widths, selected, toggle } = data;
  const d = docs[index];
  const sel = selected.has(d._id);
  const bg = sel
    ? "color-mix(in srgb, var(--blue) 8%, transparent)"
    : index % 2
      ? "transparent"
      : "color-mix(in srgb, var(--sunken) 40%, transparent)";

  return (
    <div style={{ ...style, display: "flex", background: bg }}>
      <div
        style={{
          width: widths[0],
          flex: "none",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="checkbox"
          checked={sel}
          onChange={() => toggle(d._id)}
          style={{ accentColor: "var(--blue)", cursor: "pointer" }}
        />
      </div>
      <div
        style={{
          width: widths[1],
          flex: "none",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11.5,
          color: "var(--dim)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
        }}
      >
        {d._id}
      </div>
      {cols.map((c, i) => (
        <Cell key={c} doc={d} col={c} width={widths[i + 2]} />
      ))}
    </div>
  );
}

export function DataTable() {
  const tab = useActiveTab();
  const selected = useTabsStore((s) => s.tabs[s.activeTab].selected);
  const setSelected = useTabsStore((s) => s.setSelected);
  const toggle = useTabsStore((s) => s.toggleSelected);
  const { ref, height } = useElementSize<HTMLDivElement>();

  const cols = tab.fields;
  const docs = tab.result.hits;
  const widths = useMemo(() => [CB_W, ID_W, ...cols.map(() => COL_W)], [cols]);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const allSel = docs.length > 0 && docs.every((d) => selected.has(d._id));

  const itemData: RowData = useMemo(
    () => ({ docs, cols, widths, selected, toggle }),
    [docs, cols, widths, selected, toggle],
  );

  const listHeight = Math.max(0, height - HEADER_H);

  return (
    <div
      ref={ref}
      style={{
        height: "100%",
        border: "1px solid var(--border)",
        borderRadius: 9,
        overflow: "hidden",
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ width: Math.max(totalWidth, 0) }}>
          {/* header */}
          <div style={{ display: "flex", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ ...headCell, width: CB_W }}>
              <input
                type="checkbox"
                checked={allSel}
                onChange={() => setSelected(new Set(allSel ? [] : docs.map((d) => d._id)))}
                style={{ accentColor: "var(--blue)", cursor: "pointer" }}
              />
            </div>
            <div style={{ ...headCell, width: ID_W }}>_id</div>
            {cols.map((c, i) => (
              <div key={c} style={{ ...headCell, width: widths[i + 2] }}>
                {c}
              </div>
            ))}
          </div>
          {/* virtualized rows */}
          <FixedSizeList
            height={listHeight || ROW_H * Math.min(docs.length, 12)}
            width={totalWidth}
            itemCount={docs.length}
            itemSize={ROW_H}
            itemData={itemData}
            style={{ overflowX: "hidden" }}
          >
            {Row}
          </FixedSizeList>
        </div>
      </div>
      {docs.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "var(--faint)", fontSize: 12 }}>
          No rows · run a query to populate the table
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", fontSize: 10.5, color: "var(--faint)", fontFamily: "'IBM Plex Mono', monospace" }}>
        {fmtNum(docs.length)} rows shown · {cols.length} columns · virtualized
      </div>
    </div>
  );
}
