/** Add/edit connection form (prototype: renderConnForm). */

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Segmented } from "../common/Segmented";
import { mix } from "../../theme/tokens";
import { useConnStore } from "../../stores/useConnStore";
import { setCredential } from "../../services/es";
import { testConnection } from "../../services/source";
import type { AuthKind, Connection, ConnectionDraft, EnvKind } from "../../lib/types";

const slug = (v: string): string =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-connection";

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 6 }}>
      {children}
    </div>
  );
}

const inputStyle = (mono?: boolean): CSSProperties => ({
  width: "100%",
  background: "var(--sunken)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 7,
  padding: "8px 11px",
  font: "inherit",
  fontSize: 12.5,
  fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit",
  outline: "none",
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ConnectionForm() {
  const f = useConnStore((s) => s.connForm) as ConnectionDraft;
  const testing = useConnStore((s) => s.testing);
  const setForm = useConnStore((s) => s.setForm);
  const saveConnForm = useConnStore((s) => s.saveConnForm);
  const closeConnForm = useConnStore((s) => s.closeConnForm);
  const setTesting = useConnStore((s) => s.setTesting);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const doTest = async () => {
    setTesting({ id: "form", status: "testing" });
    const synthetic: Connection = {
      id: f.id || "form",
      name: f.name,
      label: f.label,
      host: f.host,
      auth: f.auth,
      user: f.user,
      env: f.env,
      health: "unknown",
      version: "",
      nodes: 0,
      indexNames: [],
    };
    const r = await testConnection(synthetic);
    setTesting({ id: "form", status: r.ok ? "ok" : "fail", ms: r.tookMs, message: r.message });
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const secret = f.auth === "apikey" ? f.apikey : f.auth === "basic" ? f.pass : "";
    const res = await saveConnForm();
    if (!res.ok) {
      setSaveError(res.error ?? "Could not save the connection.");
      setSaving(false);
      return;
    }
    if (secret && res.saved) {
      try {
        await setCredential(res.saved.id, secret);
      } catch (e) {
        setSaveError(
          "Connection saved, but storing the credential in the Keychain failed: " +
            ((e as Error)?.message ?? String(e)),
        );
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    closeConnForm();
  };

  return (
    <div>
      <Field label="Connection name">
        <input
          value={f.label || ""}
          onChange={(e) => setForm({ label: e.target.value, name: slug(e.target.value) })}
          placeholder="Production · US-East"
          style={inputStyle()}
        />
      </Field>

      <Field label="Host URL">
        <input value={f.host || ""} onChange={(e) => setForm({ host: e.target.value })} placeholder="https://host:9200" style={inputStyle(true)} />
      </Field>

      <Field label="Authentication">
        <Segmented<AuthKind>
          value={f.auth}
          onChange={(auth) => setForm({ auth })}
          radius={7}
          padding="7px 14px"
          fontSize={12}
          width="fit-content"
          options={[
            { value: "none", label: "None" },
            { value: "basic", label: "Basic" },
            { value: "apikey", label: "API key" },
          ]}
        />
      </Field>

      {f.auth === "basic" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <Label>Username</Label>
            <input value={f.user || ""} onChange={(e) => setForm({ user: e.target.value })} placeholder="elastic" style={inputStyle(true)} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Password</Label>
            <input
              type="password"
              value={f.pass || ""}
              onChange={(e) => setForm({ pass: e.target.value })}
              placeholder="••••••••"
              style={inputStyle(true)}
            />
          </div>
        </div>
      )}

      {f.auth === "apikey" && (
        <Field label="API key">
          <input value={f.apikey || ""} onChange={(e) => setForm({ apikey: e.target.value })} placeholder="base64EncodedApiKey==" style={inputStyle(true)} />
        </Field>
      )}

      <Field label="Environment">
        <Segmented<EnvKind>
          value={f.env}
          onChange={(env) => setForm({ env })}
          radius={7}
          padding="7px 14px"
          fontSize={12}
          width="fit-content"
          options={[
            { value: "prod", label: "Production" },
            { value: "staging", label: "Staging" },
            { value: "dev", label: "Development" },
          ]}
        />
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={() => void doTest()}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "9px 16px", font: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          Test connection
        </button>
        {testing && testing.id === "form" && (
          <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: testing.status === "ok" ? "var(--green)" : testing.status === "fail" ? "var(--red)" : "var(--yellow)" }}>
            {testing.status === "ok"
              ? `✓ connected in ${testing.ms}ms`
              : testing.status === "fail"
                ? `✗ ${testing.message ?? "failed"}`
                : "testing…"}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={closeConnForm}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--dim)", borderRadius: 8, padding: "9px 16px", font: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 8, padding: "9px 18px", font: "inherit", fontSize: 12.5, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : f.id ? "Save changes" : "Add connection"}
        </button>
      </div>

      {saveError && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            borderRadius: 8,
            background: mix("var(--red)", 10),
            border: `1px solid ${mix("var(--red)", 32)}`,
            color: "var(--red)",
            fontSize: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          ✗ {saveError}
        </div>
      )}
    </div>
  );
}
