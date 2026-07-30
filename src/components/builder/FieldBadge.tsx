/** Field-type badge (prototype: the `badge` span in renderCond). */

import { TYPE_COLOR, mix, type FieldType } from "../../theme/tokens";

export function FieldBadge({ ftype }: { ftype: FieldType }) {
  const tc = TYPE_COLOR[ftype] ?? "var(--dim)";
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        color: tc,
        background: mix(tc, 13),
        border: `1px solid ${mix(tc, 32)}`,
        borderRadius: 4,
        padding: "2px 5px",
        whiteSpace: "nowrap",
        flex: "none",
      }}
    >
      {ftype}
    </span>
  );
}
