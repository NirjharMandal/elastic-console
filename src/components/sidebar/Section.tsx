/** Sidebar section with uppercase title + optional right slot (prototype: section). */

import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}

export function Section({ title, right, children }: SectionProps) {
  return (
    <div style={{ padding: "13px 14px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--faint)",
          }}
        >
          {title}
        </span>
        <div style={{ flex: 1 }} />
        {right ?? null}
      </div>
      {children}
    </div>
  );
}
