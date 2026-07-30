/**
 * Renders a flat JSON row model (lib/jsonModel.flattenJson) as token-colored
 * lines with collapse toggles, string highlight, and the epoch-timestamp
 * annotation. Kept presentational; the model is computed/memoized by callers.
 */

import { memo } from "react";
import type { CSSProperties } from "react";
import type { FlatRow, Seg } from "../../lib/jsonModel";

export const JSON_ROW_H = 20.4; // lineHeight 1.7 × 12px

const rowStyle = (depth: number): CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 12,
  lineHeight: 1.7,
  whiteSpace: "nowrap",
  paddingLeft: 13 + depth * 18,
});

function ValueSeg({ seg }: { seg: Seg }) {
  const style: CSSProperties = { color: seg.color };
  if (seg.hl) {
    style.background = "var(--mark)";
    style.borderRadius = 3;
    style.padding = "0 3px";
    (style as CSSProperties).boxDecorationBreak = "clone";
  }
  return (
    <>
      <span style={style}>{seg.text}</span>
      {seg.ts && (
        <span
          style={{
            marginLeft: 10,
            color: "var(--faint)",
            fontStyle: "italic",
            fontSize: 11,
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          🕐 {seg.ts.relative} · ⏱️ {seg.ts.absolute}
        </span>
      )}
    </>
  );
}

function segColor(kind: Seg["kind"]): string {
  switch (kind) {
    case "key":
      return "var(--jkey)";
    case "punc":
      return "var(--jpunc)";
    case "summary":
      return "var(--faint)";
    default:
      return "var(--jstr)";
  }
}

function Row({ row, onToggle }: { row: FlatRow; onToggle: (p: string) => void }) {
  return (
    <div style={rowStyle(row.depth)}>
      {row.togglePath != null && (
        <span
          onClick={() => onToggle(row.togglePath!)}
          style={{
            cursor: "pointer",
            userSelect: "none",
            display: "inline-block",
            width: 13,
            color: "var(--faint)",
            marginLeft: -13,
          }}
        >
          {row.collapsed ? "▸" : "▾"}
        </span>
      )}
      {row.segs.map((seg, i) =>
        seg.kind === "value" ? (
          <ValueSeg key={i} seg={seg} />
        ) : (
          <span key={i} style={{ color: segColor(seg.kind) }}>
            {seg.text}
          </span>
        ),
      )}
    </div>
  );
}

interface JsonLinesProps {
  rows: FlatRow[];
  onToggle: (path: string) => void;
}

function JsonLinesImpl({ rows, onToggle }: JsonLinesProps) {
  return (
    <>
      {rows.map((row) => (
        <Row key={row.id} row={row} onToggle={onToggle} />
      ))}
    </>
  );
}

export const JsonLines = memo(JsonLinesImpl);
