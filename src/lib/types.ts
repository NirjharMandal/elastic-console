/**
 * Core domain types shared across the app (UI, stores, services, Rust bridge).
 * The query-tree types mirror the prototype's node shape exactly so the pure
 * DSL translation in queryDsl.ts can be ported verbatim.
 */

import type { FieldType } from "../theme/tokens";

export type { FieldType };

/** Every operator the visual builder can produce. */
export type Operator =
  | "is"
  | "is not"
  | "contains"
  | "matches"
  | "in"
  | "exists"
  | ">"
  | "<"
  | ">="
  | "<="
  | "has any";

/** A single leaf condition row in the builder. */
export interface Condition {
  type: "cond";
  field: string;
  ftype: FieldType;
  operator: Operator;
  value: string;
}

/** A nested AND/OR group of conditions and sub-groups. */
export interface Group {
  type: "group";
  op: "AND" | "OR";
  children: QueryNode[];
}

export type QueryNode = Condition | Group;

/** A sort rule (field + direction; `_score` is the relevance pseudo-field). */
export interface SortRule {
  field: string;
  dir: "asc" | "desc";
}

/** A field as surfaced from an index mapping. */
export interface Field {
  f: string;
  t: FieldType;
}

/** Elasticsearch Query DSL is free-form JSON. */
export type Dsl = Record<string, unknown>;

/** A single search hit, normalized. */
export interface Hit {
  _id: string;
  _index: string;
  _score: number | null;
  _source: Record<string, unknown>;
}

/** An aggregation bucket (terms agg). */
export interface Bucket {
  key: string;
  count: number;
}

/** Normalized, readable Elasticsearch error (from ES error body). */
export interface EsError {
  type: string;
  reason: string;
  status: number;
  index?: string;
  shard?: number | string;
  node?: string;
  causedBy?: { type: string; reason: string };
  rootCause?: string;
}

/** Normalized result returned from either the real (Rust) or sample source. */
export interface SearchResult {
  total: number;
  took: number;
  hits: Hit[];
  buckets?: Bucket[];
  groupByField?: string | null;
  /** Total docs in the index (for aggregation percentages). */
  docCount?: number;
  error?: EsError;
}

export type AuthKind = "none" | "basic" | "apikey";
export type EnvKind = "prod" | "staging" | "dev";
export type Health = "green" | "yellow" | "red" | "unknown";

/** Connection metadata (secrets live in the macOS Keychain, never here). */
export interface Connection {
  id: string;
  name: string;
  label: string;
  host: string;
  auth: AuthKind;
  user: string;
  env: EnvKind;
  health: Health;
  version: string;
  nodes: number;
  indexNames: string[];
}

/** Editable connection form draft (may carry secrets transiently in memory). */
export interface ConnectionDraft {
  id: string;
  name: string;
  label: string;
  host: string;
  auth: AuthKind;
  user: string;
  pass?: string;
  apikey?: string;
  env: EnvKind;
}

export interface SavedQuery {
  id?: number;
  name: string;
  desc: string;
  /** Serialized TabSession snapshot (index, query tree, sorts, fields, …). */
  payload?: string;
  last: string;
  runs: number;
}

export interface HistoryEntry {
  id?: number;
  q: string;
  t: string;
}

export type ResultMode =
  | "normal"
  | "single"
  | "notfound"
  | "error"
  | "buckets";

export type ResultView = "tree" | "table";

/** One independent query tab (mirrors the prototype's TAB_KEYS). */
export interface TabSession {
  id: string;
  index: string;
  view: ResultView;
  jsonToggle: boolean;
  groupBy: string | null;
  mode: ResultMode;
  lookupId: string;
  foundId: string | null;
  pageSize: number;
  page: number;
  selected: Set<string>;
  collapsed: Set<string>;
  sorts: SortRule[];
  fields: string[];
  query: Group;
  /** Latest results for this tab (seeded from sample data, replaced on run). */
  result: SearchResult;
  /** True while a real query is in flight. */
  loading: boolean;
  /** Document resolved by an _id lookup / expand (real ES results live here). */
  fetchedDoc?: Hit | null;
  /** Live field schema from a real cluster (field-caps); undefined ⇒ use sample schema. */
  schema?: Field[];
}

/** Per-index schema + sample documents (offline source). */
export interface IndexData {
  docCount: number;
  hits: number;
  took: number;
  defaultFields: string[];
  sortFields: string[];
  groupFields: [string, string][];
  idField: string;
  fields: Field[];
  docs: Hit[];
  buckets: Record<string, Bucket[]>;
}
