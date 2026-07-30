/**
 * Return-fields multi-select. A trigger button opens an anchored popover with a
 * field search, select-all / clear, and a checkbox list of every schema field.
 * Selection is stored on the active tab (`fields`); the list comes from the live
 * schema (`resolveFields`). Defaults to all fields selected when a schema loads.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { FieldBadge } from "../builder/FieldBadge";
import { resolveFields } from "../../services/schema";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";

interface Anchor {
  left: number;
  top: number;
  width: number;
}

export function ReturnFields() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);

  const all = resolveFields(tab);
  const allNames = all.map((x) => x.f);
  const selected = tab.fields;
  const total = all.length;
  const allSelected = total > 0 && allNames.every((f) => selected.includes(f));

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [search, setSearch] = useState("");

  const open = anchor != null;
  const close = () => {
    setAnchor(null);
    setSearch("");
  };

  const label =
    total === 0 ? "No fields" : allSelected ? `All fields (${total})` : `${selected.length} of ${total} fields`;

  const filtered = all.filter((f) => f.f.toLowerCase().includes(search.toLowerCase()));

  const toggle = (f: string) =>
    patchActive({
      fields: selected.includes(f) ? selected.filter((x) => x !== f) : [...selected, f],
    });

  // Select/clear act on the currently-visible (filtered) fields, preserving schema order.
  const selectAllVisible = () => {
    const set = new Set(selected);
    filtered.forEach((f) => set.add(f.f));
    patchActive({ fields: allNames.filter((n) => set.has(n)) });
  };
  const clearVisible = () => {
    const drop = new Set(filtered.map((f) => f.f));
    patchActive({ fields: selected.filter((f) => !drop.has(f)) });
  };

  const triggerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    maxWidth: 190,
    background: "var(--sunken)",
    border: `1px solid ${open ? "var(--border-strong)" : "var(--border)"}`,
    borderRadius: 7,
    padding: "5px 10px",
    font: "inherit",
    fontSize: 12,
    color: total === 0 ? "var(--faint)" : "var(--text)",
    cursor: total === 0 ? "default" : "pointer",
    transition: "border-color .12s",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <button
        type="button"
        disabled={total === 0}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAnchor(open ? null : { left: r.left, top: r.bottom, width: r.width });
        }}
        style={triggerStyle}
        title="Return fields"
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--faint)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
            flex: "none",
          }}
        >
          fields
        </span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ color: "var(--faint)", fontSize: 8, flex: "none" }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={close} onWheel={close} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
          <div
            className="om-fade-fast"
            style={{
              position: "fixed",
              left: anchor!.left,
              top: anchor!.top + 5,
              width: Math.max(anchor!.width, 240),
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
                placeholder="Search fields…"
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderBottom: "1px solid var(--border)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "var(--faint)" }}>
                {selected.length}/{total} selected
              </span>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={selectAllVisible}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", font: "inherit", fontSize: 11, fontWeight: 600 }}
              >
                Select all
              </button>
              <span style={{ color: "var(--border-strong)" }}>·</span>
              <button
                type="button"
                onClick={clearVisible}
                style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", font: "inherit", fontSize: 11, fontWeight: 600 }}
              >
                Clear
              </button>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto", padding: 4 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--faint)", fontSize: 12 }}>
                  No matching fields
                </div>
              ) : (
                filtered.map((f) => {
                  const on = selected.includes(f.f);
                  return (
                    <label
                      key={f.f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "7px 9px",
                        borderRadius: 7,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(f.f)}
                        style={{ width: 14, height: 14, accentColor: "var(--accent)", cursor: "pointer", flex: "none" }}
                      />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12.5,
                          color: on ? "var(--text)" : "var(--dim)",
                          fontWeight: on ? 600 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.f}
                      </span>
                      <FieldBadge ftype={f.t} />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
