/**
 * Typed bridge to the Rust Elasticsearch command layer.
 *
 * The WebView NEVER talks to Elasticsearch directly — every call here invokes a
 * Rust command (reqwest transport, credentials resolved from the macOS Keychain
 * on the Rust side). Command names + payload shapes mirror src-tauri/src/commands.
 * tauri-specta also emits src/bindings.ts as the canonical typed contract.
 */

import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Connection, Dsl, EsError, Field, Health, Hit, SearchResult } from "../lib/types";

/** A raw, transport-level failure (could not reach the cluster). */
export class EsTransportError extends Error {}

export interface IndexInfo {
  name: string;
  docs: number;
  health?: Health;
}

export interface ClusterInfo {
  health: Health;
  version: string;
  nodes: number;
}

export interface TestResult {
  ok: boolean;
  tookMs: number;
  version?: string;
  nodes?: number;
  health?: Health;
  message?: string;
}

/** Connection metadata passed to Rust (the secret is resolved server-side). */
interface ConnInput {
  id: string;
  host: string;
  auth: string;
  user: string;
}

const connInput = (c: Connection): ConnInput => ({
  id: c.id,
  host: c.host,
  auth: c.auth,
  user: c.user,
});

export const hasTauri = (): boolean => isTauri();

async function call<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    // Rust returns ES-level failures inside the result; transport/keychain
    // failures throw a string here. Re-wrap so callers can branch.
    throw new EsTransportError(typeof e === "string" ? e : (e as Error)?.message ?? String(e));
  }
}

export async function esSearch(conn: Connection, index: string, dsl: Dsl): Promise<SearchResult> {
  return call<SearchResult>("es_search", { conn: connInput(conn), index, dsl });
}

export async function esGetDoc(conn: Connection, index: string, id: string): Promise<Hit | null> {
  return call<Hit | null>("es_get_doc", { conn: connInput(conn), index, id });
}

export async function esListIndices(conn: Connection): Promise<IndexInfo[]> {
  return call<IndexInfo[]>("es_list_indices", { conn: connInput(conn) });
}

export async function esClusterHealth(conn: Connection): Promise<ClusterInfo> {
  return call<ClusterInfo>("es_cluster_health", { conn: connInput(conn) });
}

export async function esFieldCaps(conn: Connection, index: string): Promise<Field[]> {
  return call<Field[]>("es_field_caps", { conn: connInput(conn), index });
}

export async function esTestConnection(conn: Connection): Promise<TestResult> {
  return call<TestResult>("es_test_connection", { conn: connInput(conn) });
}

// ---- Keychain (secrets stay on the Rust side) ------------------------------

export async function setCredential(connId: string, secret: string): Promise<void> {
  if (!isTauri()) return;
  await call<null>("set_credential", { connId, secret });
}

export async function deleteCredential(connId: string): Promise<void> {
  if (!isTauri()) return;
  await call<null>("delete_credential", { connId });
}

/** Narrow an arbitrary error into our readable EsError, if it is one. */
export function asEsError(e: unknown): EsError | null {
  if (e && typeof e === "object" && "reason" in e && "type" in e) {
    return e as EsError;
  }
  return null;
}
