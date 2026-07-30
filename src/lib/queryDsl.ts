/**
 * Visual query builder -> Elasticsearch Query DSL translation.
 *
 * This is the heart of the app: a pure, UI-free, transport-free module ported
 * verbatim from the design prototype's `toDSL`. It is exhaustively unit-tested
 * in queryDsl.test.ts. Keep it free of React, I/O, and side effects.
 */

import type { Condition, Dsl, Group, QueryNode, SortRule } from "./types";
import { coerce } from "./format";

const RANGE_OP: Record<string, "gt" | "lt" | "gte" | "lte"> = {
  ">": "gt",
  "<": "lt",
  ">=": "gte",
  "<=": "lte",
};

/** Translate a single leaf condition into a DSL clause. */
function clause(node: QueryNode): Dsl {
  if (node.type === "group") return group(node);

  const c: Condition = node;
  const f = c.field;
  const v = c.value;

  if (c.operator === "exists") return { exists: { field: f } };

  if (c.operator in RANGE_OP) {
    const m = RANGE_OP[c.operator];
    return { range: { [f]: { [m]: coerce(v) } } };
  }

  if (c.operator === "contains" || c.operator === "matches") {
    return { match: { [f]: v } };
  }

  if (c.operator === "in") {
    return {
      terms: {
        [f]: String(v)
          .split(",")
          .map((s) => s.trim()),
      },
    };
  }

  if (c.operator === "is not") {
    return { bool: { must_not: [{ term: { [f]: coerce(v) } }] } };
  }

  if (c.operator === "has any") {
    return { nested: { path: f, query: { exists: { field: f } } } };
  }

  // "is" and any fallthrough.
  return { term: { [f]: coerce(v) } };
}

/** Translate an AND/OR group (recursively) into a bool query. */
function group(g: Group): Dsl {
  const children = g.children.map(clause);
  return g.op === "OR"
    ? { bool: { should: children, minimum_should_match: 1 } }
    : { bool: { must: children } };
}

export interface BuildDslInput {
  query: Group;
  sorts: SortRule[];
  pageSize: number;
  fields: string[];
  groupBy?: string | null;
  /** Pagination offset (page-1)*pageSize; omitted/0 means no `from`. */
  from?: number;
}

/**
 * Compose the full search request body from the builder state.
 * Mirrors the prototype's `toDSL` exactly, including the group-by aggregation
 * path (`size: 0` + a terms agg keyed `by_<field>`).
 */
export function buildDsl(input: BuildDslInput): Dsl {
  const { query, sorts, pageSize, fields, groupBy, from } = input;

  const dsl: Dsl = {
    query: group(query),
    sort: sorts.map((s) =>
      s.field === "_score"
        ? { _score: s.dir }
        : { [s.field]: { order: s.dir } },
    ),
    size: pageSize,
    _source: fields,
  };

  if (from && from > 0) dsl.from = from;

  if (groupBy) {
    dsl.size = 0;
    dsl.aggs = {
      ["by_" + groupBy.replace(/\./g, "_")]: {
        terms: { field: groupBy, size: 10 },
      },
    };
  }

  return dsl;
}

/** Count the leaf conditions in a query tree (prototype: condCount). */
export function countConditions(g: Group): number {
  let n = 0;
  const walk = (node: Group) =>
    node.children.forEach((c) => {
      if (c.type === "group") walk(c);
      else n++;
    });
  walk(g);
  return n;
}
