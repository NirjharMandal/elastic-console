/**
 * Shared anchored dropdown (prototype: ddBtn + ddMenu).
 *
 * <Dropdown> renders the trigger button and opens a single global menu anchored
 * to it; <DropdownMenu> renders that menu once at the app root (portal-like via
 * fixed positioning). Options are plain values or [value, label] tuples.
 */

import { memo, useCallback } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useUiStore } from "../../stores/useUiStore";
import type { DdOption } from "../../stores/useUiStore";

export type DdValue = string | number;
export type DdOptionInput = DdValue | [DdValue, string];

interface DropdownProps {
  ddKey: string;
  value: DdValue;
  options: DdOptionInput[];
  onChange: (v: DdValue) => void;
  mono?: boolean;
  flex?: number | string;
  full?: boolean;
  color?: string;
  fontSize?: number;
  minWidth?: number;
  maxWidth?: number;
  placeholder?: string;
  dashed?: boolean;
}

const normalize = (options: DdOptionInput[]): DdOption[] =>
  options.map((op) =>
    Array.isArray(op) ? { v: op[0], label: String(op[1]) } : { v: op, label: String(op) },
  );

function DropdownImpl({
  ddKey,
  value,
  options,
  onChange,
  mono,
  flex,
  full,
  color,
  fontSize,
  minWidth,
  maxWidth,
  placeholder,
  dashed,
}: DropdownProps) {
  const open = useUiStore((s) => s.dd?.key === ddKey);
  const openDropdown = useUiStore((s) => s.openDropdown);

  const norm = normalize(options);
  const cur = norm.find((x) => x.v === value);
  const label = placeholder != null ? placeholder : cur ? cur.label : String(value);

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      openDropdown({
        key: ddKey,
        rect: { left: r.left, top: r.bottom, width: r.width },
        options: norm,
        onChange: onChange as (v: DdValue) => void,
        value,
      });
    },
    // norm is derived from options each render; safe to depend on the primitives
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ddKey, value, options, onChange, openDropdown],
  );

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    flex,
    width: full ? "100%" : undefined,
    background: dashed ? "transparent" : "var(--sunken)",
    border: `1px ${dashed ? "dashed" : "solid"} ${
      open ? "var(--border-strong)" : dashed ? "var(--border-strong)" : "var(--border)"
    }`,
    color: color || "var(--text)",
    borderRadius: 6,
    padding: "5px 8px",
    font: "inherit",
    fontSize: fontSize ?? 12,
    cursor: "pointer",
    fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit",
    minWidth,
    maxWidth,
    whiteSpace: "nowrap",
    overflow: "hidden",
  };

  return (
    <button type="button" onClick={onClick} style={style}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={{ color: "var(--faint)", fontSize: 8, flex: "none", marginLeft: 2 }}>▾</span>
    </button>
  );
}

export const Dropdown = memo(DropdownImpl);

/** The single floating menu for the currently-open dropdown. Mount once at root. */
export function DropdownMenu() {
  const dd = useUiStore((s) => s.dd);
  const close = useUiStore((s) => s.closeDropdown);
  if (!dd) return null;

  return (
    <>
      <div
        onClick={close}
        onWheel={close}
        style={{ position: "fixed", inset: 0, zIndex: 70 }}
      />
      <div
        className="om-fade-fast"
        style={{
          position: "fixed",
          left: dd.rect.left,
          top: dd.rect.top + 4,
          minWidth: Math.max(dd.rect.width, 128),
          maxHeight: 300,
          overflowY: "auto",
          background: "var(--elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8,
          boxShadow: "0 12px 34px rgba(0,0,0,0.3)",
          zIndex: 71,
          padding: 4,
        }}
      >
        {dd.options.map((op, i) => {
          const selected = op.v === dd.value;
          return (
            <div
              key={i}
              onClick={() => {
                dd.onChange(op.v);
                close();
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.background = "var(--hover)";
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.background = "transparent";
              }}
              style={{
                padding: "6px 9px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12.5,
                fontFamily: "'IBM Plex Mono', monospace",
                background: selected ? "var(--accent-soft)" : "transparent",
                color: selected ? "var(--text)" : "var(--dim)",
                fontWeight: selected ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {op.label}
            </div>
          );
        })}
      </div>
    </>
  );
}
