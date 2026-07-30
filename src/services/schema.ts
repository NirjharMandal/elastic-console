/**
 * Resolves the schema used by the builder/sort/group/fields UI for a tab.
 *
 * Schema comes exclusively from a live cluster (field-caps via the Rust bridge);
 * there is no offline sample fallback. When no live schema is loaded the UI shows
 * empty option lists until a real connection responds.
 */

import type { Field, TabSession } from "../lib/types";
import type { IndexInfo } from "./es";

export interface IndexEntry {
  name: string;
  docs: number;
  hasSchema: boolean;
}

/** Live cluster indices when loaded, otherwise an empty list. */
export function effectiveIndices(liveIndices: IndexInfo[] | null): IndexEntry[] {
  if (liveIndices && liveIndices.length) {
    return liveIndices.map((i) => ({ name: i.name, docs: i.docs, hasSchema: true }));
  }
  return [];
}

export function resolveFields(tab: TabSession): Field[] {
  return tab.schema ?? [];
}

export function resolveSortFields(tab: TabSession): string[] {
  if (!tab.schema) return ["_score"];
  return ["_score", ...tab.schema.filter((f) => f.t === "long" || f.t === "date").map((f) => f.f)];
}

export function resolveGroupFields(tab: TabSession): [string, string][] {
  if (!tab.schema) return [["", "none"]];
  return [
    ["", "none"],
    ...tab.schema.filter((f) => f.t === "keyword").map((f) => [f.f, f.f] as [string, string]),
  ];
}

/** Field to seed a fresh condition with (prefer a keyword); undefined when no schema. */
export function firstQueryField(fields: Field[]): Field | undefined {
  return fields.find((f) => f.t === "keyword") ?? fields[0];
}
