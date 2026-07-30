/**
 * SQLite persistence via tauri-plugin-sql.
 *
 * Holds non-secret data: saved queries, auto-tracked query history, settings,
 * and connection metadata. Credentials NEVER live here — they go to the macOS
 * Keychain through Rust commands (services/es.ts -> keychain commands).
 *
 * Every call degrades gracefully when not running under Tauri (e.g. `npm run
 * dev` in a plain browser, or vitest), so the UI still renders with sample data.
 */

import { isTauri } from "@tauri-apps/api/core";
import type { Connection, HistoryEntry, SavedQuery } from "../lib/types";

type SqlDatabase = {
  execute: (q: string, bind?: unknown[]) => Promise<unknown>;
  select: <T>(q: string, bind?: unknown[]) => Promise<T>;
};

let dbPromise: Promise<SqlDatabase | null> | null = null;

async function db(): Promise<SqlDatabase | null> {
  if (!isTauri()) return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      // Migrations are registered on the Rust side and run on load.
      return (await Database.load("sqlite:elastic_console.db")) as unknown as SqlDatabase;
    })().catch((e) => {
      console.error("DB load failed; running without persistence:", e);
      return null;
    });
  }
  return dbPromise;
}

// ---- settings (key/value) --------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const d = await db();
  if (!d) return null;
  const rows = await d.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = ?1",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute(
    "INSERT INTO settings (key, value) VALUES (?1, ?2) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

// ---- connections (metadata only) ------------------------------------------

interface ConnRow {
  id: string;
  name: string;
  label: string;
  host: string;
  auth: string;
  user: string;
  env: string;
  index_names: string;
}

export async function listConnections(): Promise<Connection[] | null> {
  const d = await db();
  if (!d) return null;
  const rows = await d.select<ConnRow[]>(
    "SELECT * FROM connections ORDER BY rowid ASC",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    host: r.host,
    auth: r.auth as Connection["auth"],
    user: r.user,
    env: r.env as Connection["env"],
    health: "unknown",
    version: "",
    nodes: 0,
    indexNames: safeParse<string[]>(r.index_names, []),
  }));
}

export async function upsertConnection(c: Connection): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute(
    "INSERT INTO connections (id, name, label, host, auth, user, env, index_names) " +
      "VALUES (?1,?2,?3,?4,?5,?6,?7,?8) " +
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name, label=excluded.label, " +
      "host=excluded.host, auth=excluded.auth, user=excluded.user, env=excluded.env, " +
      "index_names=excluded.index_names",
    [c.id, c.name, c.label, c.host, c.auth, c.user, c.env, JSON.stringify(c.indexNames)],
  );
}

export async function deleteConnectionRow(id: string): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute("DELETE FROM connections WHERE id = ?1", [id]);
}

// ---- saved queries ---------------------------------------------------------

export async function listSavedQueries(): Promise<SavedQuery[] | null> {
  const d = await db();
  if (!d) return null;
  return d.select<SavedQuery[]>(
    "SELECT id, name, desc, payload, last, runs FROM saved_queries ORDER BY id DESC",
  );
}

export async function insertSavedQuery(q: SavedQuery): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute(
    "INSERT INTO saved_queries (name, desc, payload, last, runs) VALUES (?1,?2,?3,?4,?5)",
    [q.name, q.desc, q.payload ?? "", q.last, q.runs],
  );
}

export async function deleteSavedQuery(id: number): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute("DELETE FROM saved_queries WHERE id = ?1", [id]);
}

// ---- history (auto-tracked) ------------------------------------------------

export async function listHistory(limit = 50): Promise<HistoryEntry[] | null> {
  const d = await db();
  if (!d) return null;
  return d.select<HistoryEntry[]>(
    "SELECT id, q, t FROM query_history ORDER BY id DESC LIMIT ?1",
    [limit],
  );
}

export async function insertHistory(q: string, t: string): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.execute("INSERT INTO query_history (q, t) VALUES (?1, ?2)", [q, t]);
}

function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
