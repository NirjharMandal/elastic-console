/** Connection manager overlay (prototype: renderConnOverlay). */

import { useState } from "react";
import type { CSSProperties } from "react";
import { Modal } from "../common/Modal";
import { ConnectionForm } from "./ConnectionForm";
import { ENV_COLOR, HEALTH_COLOR, mix } from "../../theme/tokens";
import { useConnStore } from "../../stores/useConnStore";
import { deleteCredential } from "../../services/es";
import { testConnection } from "../../services/source";
import type { Connection } from "../../lib/types";

const ghost: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--dim)",
  borderRadius: 6,
  padding: "5px 10px",
  font: "inherit",
  fontSize: 11.5,
  fontWeight: 500,
  cursor: "pointer",
};

export function ConnectionsModal() {
  const open = useConnStore((s) => s.connOverlay);
  const connections = useConnStore((s) => s.connections);
  const connId = useConnStore((s) => s.connId);
  const connForm = useConnStore((s) => s.connForm);
  const testing = useConnStore((s) => s.testing);
  const setConn = useConnStore((s) => s.setConn);
  const setConnOverlay = useConnStore((s) => s.setConnOverlay);
  const openConnForm = useConnStore((s) => s.openConnForm);
  const closeConnForm = useConnStore((s) => s.closeConnForm);
  const deleteConn = useConnStore((s) => s.deleteConn);
  const setTesting = useConnStore((s) => s.setTesting);
  const setHealth = useConnStore((s) => s.setHealth);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!open) return null;
  const editing = !!connForm;

  const removeConn = (id: string) => {
    deleteConn(id);
    void deleteCredential(id);
    setConfirmId(null);
  };

  const test = async (conn: Connection) => {
    setTesting({ id: conn.id, status: "testing" });
    const r = await testConnection(conn);
    setTesting({ id: conn.id, status: r.ok ? "ok" : "fail", ms: r.tookMs, message: r.message });
    if (r.ok && r.health) setHealth(conn.id, r.health, r.version, r.nodes);
  };

  const card = (c: Connection) => {
    const active = c.id === connId;
    const ec = ENV_COLOR[c.env] ?? "var(--dim)";
    const hc = HEALTH_COLOR[c.health] ?? "var(--faint)";
    const t = testing && testing.id === c.id ? testing : null;
    return (
      <div
        key={c.id}
        style={{
          display: "flex",
          alignItems: "stretch",
          border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 10,
          background: "var(--panel)",
          marginBottom: 9,
          overflow: "hidden",
        }}
      >
        <div style={{ width: 4, flex: "none", background: ec }} />
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: hc, flex: "none" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: ec, background: mix(ec, 13), borderRadius: 4, padding: "1px 5px" }}>
              {c.env}
            </span>
            {active && (
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--green)", background: mix("var(--green)", 14), borderRadius: 4, padding: "1px 6px" }}>
                active session
              </span>
            )}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 7 }}>
            {c.host}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "var(--faint)", fontFamily: "'IBM Plex Mono', monospace", flexWrap: "wrap" }}>
            <span>auth: {c.auth}</span>
            {c.version && <span>v{c.version}</span>}
            {c.nodes > 0 && <span>{c.nodes} node{c.nodes > 1 ? "s" : ""}</span>}
            <span>{c.indexNames.length} indices</span>
            {t && (
              <span style={{ color: t.status === "ok" ? "var(--green)" : t.status === "fail" ? "var(--red)" : "var(--yellow)", fontWeight: 600 }}>
                {t.status === "ok" ? `✓ connected ${t.ms}ms` : t.status === "fail" ? `✗ ${t.message ?? "failed"}` : "testing…"}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, padding: "12px 14px", borderLeft: "1px solid var(--border)", flex: "none" }}>
          {active ? (
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", textAlign: "center" }}>In use</div>
          ) : (
            <button type="button" onClick={() => setConn(c.id)} style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 6, padding: "6px 16px", font: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              Use
            </button>
          )}
          {confirmId === c.id ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600, marginRight: 2 }}>Delete?</span>
              <button
                type="button"
                title="confirm delete"
                style={{ ...ghost, color: "var(--red)", borderColor: mix("var(--red)", 40), fontWeight: 700, padding: "5px 10px" }}
                onClick={() => removeConn(c.id)}
              >
                Delete
              </button>
              <button type="button" title="cancel" style={ghost} onClick={() => setConfirmId(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" style={ghost} onClick={() => void test(c)}>
                Test
              </button>
              <button type="button" style={ghost} onClick={() => openConnForm(c)}>
                Edit
              </button>
              <button type="button" title="delete" style={{ ...ghost, padding: "5px 9px", fontSize: 13 }} onClick={() => setConfirmId(c.id)}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal onClose={() => setConnOverlay(false)} width={660} maxWidth="94vw" maxHeight="82vh" paddingTop="7vh">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
        {editing && (
          <button type="button" title="back" onClick={closeConnForm} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--dim)", cursor: "pointer", fontSize: 15 }}>
            ‹
          </button>
        )}
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {editing ? (connForm!.id ? "Edit connection" : "New connection") : "Connections"}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{editing ? "" : `${connections.length} clusters`}</span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setConnOverlay(false)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--dim)", cursor: "pointer", fontSize: 15 }}>
          ×
        </button>
      </div>

      <div style={{ padding: "16px 18px", overflowY: "auto" }}>
        {editing ? (
          <ConnectionForm />
        ) : (
          <div>
            {connections.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 12.5, padding: "10px 0 16px" }}>
                No connections yet — add a cluster to get started.
              </div>
            )}
            {connections.map(card)}
            <button
              type="button"
              onClick={() => openConnForm(null)}
              style={{ width: "100%", marginTop: 4, background: "transparent", border: "1px dashed var(--border-strong)", color: "var(--dim)", borderRadius: 9, padding: "12px", font: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
            >
              + New connection
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
