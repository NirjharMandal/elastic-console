/**
 * Configurable segmented control. The prototype uses this shape in several
 * places (AND/OR toggle, asc/desc, tree/table view, theme, auth/env) with
 * slightly different sizing — props expose just enough to match each verbatim.
 */

import type { CSSProperties, ReactNode } from "react";

export interface SegOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string | number> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  bg?: string;
  borderColor?: string;
  radius?: number;
  width?: string;
  padding?: string;
  fontSize?: number;
  fontWeight?: number;
  mono?: boolean;
  activeColor?: string;
  activeBg?: string;
  inactiveColor?: string;
  inactiveBg?: string;
  segGap?: number;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  bg,
  borderColor = "var(--border)",
  radius = 6,
  width,
  padding = "5px 10px",
  fontSize = 11.5,
  fontWeight = 600,
  mono,
  activeColor = "var(--accent-text)",
  activeBg = "var(--accent)",
  inactiveColor = "var(--dim)",
  inactiveBg = "transparent",
  segGap = 5,
}: SegmentedProps<T>) {
  const container: CSSProperties = {
    display: "flex",
    border: `1px solid ${borderColor}`,
    borderRadius: radius,
    overflow: "hidden",
    background: bg,
    width,
    fontFamily: mono ? "'IBM Plex Mono', monospace" : undefined,
  };

  return (
    <div style={container}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <div
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: segGap,
              padding,
              fontSize,
              fontWeight,
              cursor: "pointer",
              color: active ? activeColor : inactiveColor,
              background: active ? activeBg : inactiveBg,
              transition: "all .12s",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </div>
        );
      })}
    </div>
  );
}
