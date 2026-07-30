/** Saved-queries + history quick row (prototype: savedBody). */

import type { CSSProperties } from "react";
import { useUiStore } from "../../stores/useUiStore";

const btn: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "var(--elev)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 7,
  padding: "8px",
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

export function LibraryRow() {
  const openSaved = useUiStore((s) => s.setSavedOverlay);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button type="button" style={btn} onClick={() => openSaved(true)}>
        ☆ Saved queries
      </button>
      <button type="button" style={btn} onClick={() => openSaved(true)}>
        ↻ History
      </button>
    </div>
  );
}
