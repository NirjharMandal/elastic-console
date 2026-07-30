/**
 * Backdrop + centered panel shell for the Saved-queries and Connections
 * overlays (prototype: renderOverlay / renderConnOverlay wrappers).
 */

import type { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  width: number;
  maxWidth?: string;
  maxHeight?: string;
  paddingTop?: string;
  children: ReactNode;
}

export function Modal({
  onClose,
  width,
  maxWidth = "92vw",
  maxHeight = "80vh",
  paddingTop = "8vh",
  children,
}: ModalProps) {
  return (
    <div
      className="om-fade"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth,
          maxHeight,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          border: "1px solid var(--border-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
