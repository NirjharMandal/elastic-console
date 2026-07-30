/** Saved queries + auto-tracked history overlay (prototype: renderOverlay). */

import { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { listHistory, listSavedQueries } from "../../services/db";
import { useUiStore } from "../../stores/useUiStore";
import type { HistoryEntry, SavedQuery } from "../../lib/types";

export function SavedQueriesModal() {
  const open = useUiStore((s) => s.savedOverlay);
  const close = useUiStore((s) => s.setSavedOverlay);
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const [s, h] = await Promise.all([listSavedQueries(), listHistory()]);
      setSaved(s ?? []);
      setHistory(h ?? []);
    })();
  }, [open]);

  if (!open) return null;
  const filtered = saved.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal onClose={() => close(false)} width={600} paddingTop="8vh">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Saved queries</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => close(false)}
          style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--dim)", cursor: "pointer", fontSize: 15 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "14px 18px", overflowY: "auto" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved queries…"
          style={{
            width: "100%",
            background: "var(--sunken)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 8,
            padding: "9px 12px",
            font: "inherit",
            fontSize: 13,
            outline: "none",
            marginBottom: 14,
          }}
        />

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 12.5, padding: "8px 0 14px" }}>
            {search ? "No matching saved queries." : "No saved queries yet."}
          </div>
        )}
        {filtered.map((s, i) => (
          <div
            key={s.id ?? i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              marginBottom: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.desc}
              </div>
            </div>
            <div style={{ flex: "none", textAlign: "right", marginRight: 6 }}>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>last run {s.last}</div>
              <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{s.runs} runs</div>
            </div>
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              <button type="button" onClick={() => close(false)} style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 6, padding: "6px 12px", font: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                Load
              </button>
              <button type="button" title="duplicate" style={{ background: "transparent", color: "var(--dim)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 9px", font: "inherit", fontSize: 11.5, cursor: "pointer" }}>
                ⧉
              </button>
              <button type="button" title="delete" style={{ background: "transparent", color: "var(--faint)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 9px", font: "inherit", fontSize: 13, cursor: "pointer" }}>
                ×
              </button>
            </div>
          </div>
        ))}

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)", margin: "18px 0 4px" }}>
          Recent history · auto-tracked
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 9, padding: "4px 14px" }}>
          {history.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 12, padding: "10px 0" }}>
              No history yet — run a query to populate it.
            </div>
          )}
          {history.map((h, i) => (
            <div
              key={h.id ?? i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 4px",
                borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ color: "var(--faint)", fontSize: 11 }}>↻</span>
              <span style={{ flex: 1, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {h.q}
              </span>
              <span style={{ fontSize: 11, color: "var(--faint)", flex: "none" }}>{h.t}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
