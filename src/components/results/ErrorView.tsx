/** Readable Elasticsearch error card (prototype: renderError). */

import type { CSSProperties } from "react";
import { mix } from "../../theme/tokens";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import type { EsError } from "../../lib/types";

/** The prototype's canned example, used when no real error is present. */
const DEFAULT_ERROR: EsError = {
  type: "query_shard_exception",
  status: 400,
  reason:
    "failed to parse date field [created_at] with value [last_week]; expected ISO-8601 or epoch_millis but recognized neither",
  index: "orders",
  shard: 2,
  node: "es-prod-use1-data-03",
  causedBy: {
    type: "illegal_argument_exception",
    reason: 'Cannot parse "last_week": Text ‘last_week’ could not be parsed at index 0',
  },
};

function Line({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "2px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
      <span style={{ color: "var(--faint)", minWidth: 96, flex: "none" }}>{label}</span>
      <span style={{ color: color || "var(--text)", wordBreak: "break-word" }}>{val}</span>
    </div>
  );
}

const box: CSSProperties = {
  background: "var(--sunken)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 14px",
  marginBottom: 14,
};

export function ErrorView() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);
  const err = tab.result.error ?? DEFAULT_ERROR;

  return (
    <div style={{ maxWidth: 680, margin: "10px auto" }}>
      <div
        style={{
          border: `1px solid ${mix("var(--red)", 45, "var(--border)")}`,
          borderRadius: 10,
          background: mix("var(--red)", 6, "var(--panel)"),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: `1px solid ${mix("var(--red)", 30, "var(--border)")}`,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--red)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {err.type}
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--red)",
              fontFamily: "'IBM Plex Mono', monospace",
              background: mix("var(--red)", 14),
              padding: "3px 9px",
              borderRadius: 6,
            }}
          >
            HTTP {err.status}
          </span>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 14, color: "var(--text)" }}>
            The search request could not be completed. Elasticsearch reported a{" "}
            <strong>{err.type}</strong>.
          </div>

          <div style={box}>
            <Line label="type" val={`"${err.type}"`} color="var(--jstr)" />
            <Line label="reason" val={`"${err.reason}"`} color="var(--red)" />
            {err.index && <Line label="index" val={`"${err.index}"`} color="var(--jstr)" />}
            {err.shard != null && <Line label="shard" val={String(err.shard)} color="var(--jnum)" />}
            {err.node && <Line label="node" val={`"${err.node}"`} color="var(--jstr)" />}
          </div>

          {err.causedBy && (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--faint)",
                  marginBottom: 8,
                }}
              >
                caused_by
              </div>
              <div style={{ ...box, marginBottom: 16 }}>
                <Line label="type" val={`"${err.causedBy.type}"`} color="var(--jstr)" />
                <Line label="reason" val={`"${err.causedBy.reason}"`} color="var(--dim)" />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => patchActive({ mode: "normal" })}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: 7,
                padding: "8px 16px",
                font: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Edit query
            </button>
            <button
              type="button"
              onClick={() => patchActive({ jsonToggle: true, mode: "normal" })}
              style={{
                background: "transparent",
                color: "var(--dim)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                padding: "8px 16px",
                font: "inherit",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Inspect DSL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
