/** Draggable sidebar resize handle (prototype: startResize). */

import type { MouseEvent } from "react";
import { useUiStore } from "../../stores/useUiStore";

export function ResizeHandle() {
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const persist = useUiStore((s) => s.persistSidebarWidth);

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sw = useUiStore.getState().sidebarWidth;
    const onMove = (ev: globalThis.MouseEvent) => setSidebarWidth(sw + (ev.clientX - sx));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      persist();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={startResize}
      style={{
        width: 7,
        flex: "none",
        cursor: "col-resize",
        margin: "0 -3px",
        zIndex: 4,
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 1, height: "100%", background: "var(--border)" }} />
    </div>
  );
}
