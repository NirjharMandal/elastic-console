/** A result document card: metadata header + collapsible JSON body (prototype: docCard). */

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { JsonLines } from "./JsonLines";
import { flattenJson } from "../../lib/jsonModel";
import { useTabsStore } from "../../stores/useTabsStore";
import type { Hit } from "../../lib/types";

const actStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--dim)",
  borderRadius: 5,
  padding: "3px 8px",
  font: "inherit",
  fontSize: 10.5,
  fontWeight: 500,
  cursor: "pointer",
};

function Meta({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
      <span style={{ color: "var(--faint)" }}>{k}: </span>
      <span style={{ color: color || "var(--dim)" }}>{v}</span>
    </span>
  );
}

interface DocCardProps {
  doc: Hit;
  prefix: string;
}

type Copied = "json" | "raw" | null;

export function DocCard({ doc, prefix }: DocCardProps) {
  const collapsed = useTabsStore((s) => s.tabs[s.activeTab].collapsed);
  const sel = useTabsStore((s) => s.tabs[s.activeTab].selected.has(doc._id));
  const toggleSelected = useTabsStore((s) => s.toggleSelected);
  const toggleCollapsed = useTabsStore((s) => s.toggleCollapsed);
  const patchActive = useTabsStore((s) => s.patchActive);

  const [copied, setCopied] = useState<Copied>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useMemo(
    () =>
      flattenJson(doc._source, prefix + doc._id, null, {
        collapsed,
        annotateTime: true,
      }),
    [doc, prefix, collapsed],
  );

  const copy = (which: Exclude<Copied, null>) => {
    const text = which === "json" ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
    const flash = () => {
      setCopied(which);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(null), 1200);
    };
    try {
      const p = navigator.clipboard?.writeText(text);
      if (p && typeof p.then === "function") p.then(flash).catch(() => {});
      else flash();
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${sel ? "var(--blue)" : "var(--border)"}`,
        borderRadius: 9,
        marginBottom: 10,
        background: "var(--panel)",
        overflow: "hidden",
        transition: "border-color .12s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--sunken)",
        }}
      >
        <input
          type="checkbox"
          checked={sel}
          onChange={() => toggleSelected(doc._id)}
          style={{ width: 14, height: 14, accentColor: "var(--blue)", cursor: "pointer" }}
        />
        <Meta k="_id" v={doc._id} color="var(--text)" />
        <Meta k="_index" v={doc._index} />
        <Meta k="_score" v={doc._score == null ? "—" : String(doc._score)} color="var(--jnum)" />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={{
            ...actStyle,
            color: copied === "json" ? "var(--green)" : actStyle.color,
            borderColor: copied === "json" ? "var(--green)" : "var(--border)",
          }}
          onClick={() => copy("json")}
          title="Copy pretty-printed JSON"
        >
          {copied === "json" ? "copied ✓" : "copy JSON"}
        </button>
        <button
          type="button"
          style={actStyle}
          onClick={() => patchActive({ mode: "single", foundId: doc._id, lookupId: doc._id, fetchedDoc: doc })}
          title="Open this document in the single-document view"
        >
          expand
        </button>
        <button
          type="button"
          style={{
            ...actStyle,
            color: copied === "raw" ? "var(--green)" : actStyle.color,
            borderColor: copied === "raw" ? "var(--green)" : "var(--border)",
          }}
          onClick={() => copy("raw")}
          title="Copy raw minified JSON (single line)"
        >
          {copied === "raw" ? "copied ✓" : "raw"}
        </button>
      </div>
      <div style={{ padding: "10px 14px", overflowX: "auto" }}>
        <JsonLines rows={rows} onToggle={toggleCollapsed} />
      </div>
    </div>
  );
}
