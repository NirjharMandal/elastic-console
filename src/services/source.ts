/**
 * Data-source router. The UI calls these; they route to a real cluster through
 * the Rust bridge (es.ts). There is no offline sample source: when not running
 * under Tauri, or when a cluster cannot be reached (transport error), reads
 * resolve to an empty result so the UI shows a clean blank state rather than
 * fabricated data. Genuine Elasticsearch *query* errors (e.g. a bad date range)
 * are still surfaced as SearchResult.error.
 */

import type { Connection, Dsl, Hit, SearchResult } from "../lib/types";
import {
  EsTransportError,
  esClusterHealth,
  esGetDoc,
  esListIndices,
  esSearch,
  esTestConnection,
  hasTauri,
  type ClusterInfo,
  type IndexInfo,
  type TestResult,
} from "./es";

const emptyResult = (groupBy: string | null): SearchResult => ({
  total: 0,
  took: 0,
  hits: [],
  groupByField: groupBy ?? null,
  ...(groupBy ? { buckets: [], docCount: 0 } : {}),
});

export async function runSearch(
  conn: Connection | undefined,
  index: string,
  dsl: Dsl,
  groupBy: string | null,
): Promise<SearchResult> {
  if (!conn || !index || !hasTauri()) return emptyResult(groupBy);
  try {
    const res = await esSearch(conn, index, dsl);
    return { ...res, groupByField: groupBy ?? null };
  } catch (e) {
    // Could not reach the cluster — degrade to an empty result so the UI stays usable.
    if (e instanceof EsTransportError) return emptyResult(groupBy);
    throw e;
  }
}

export async function getDoc(
  conn: Connection | undefined,
  index: string,
  id: string,
): Promise<Hit | null> {
  if (!conn || !index || !hasTauri()) return null;
  try {
    return await esGetDoc(conn, index, id);
  } catch (e) {
    if (e instanceof EsTransportError) return null;
    throw e;
  }
}

export async function listIndices(conn: Connection | undefined): Promise<IndexInfo[]> {
  if (!conn || !hasTauri()) return [];
  try {
    return await esListIndices(conn);
  } catch {
    return [];
  }
}

export async function clusterHealth(conn: Connection | undefined): Promise<ClusterInfo | null> {
  if (!conn || !hasTauri()) return null;
  try {
    return await esClusterHealth(conn);
  } catch {
    return null;
  }
}

export async function testConnection(conn: Connection): Promise<TestResult> {
  if (!hasTauri()) {
    return { ok: false, tookMs: 0, message: "not running under Tauri" };
  }
  try {
    return await esTestConnection(conn);
  } catch (e) {
    return { ok: false, tookMs: 0, message: (e as Error)?.message ?? "connection failed" };
  }
}
