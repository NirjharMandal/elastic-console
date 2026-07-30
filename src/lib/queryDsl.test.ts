import { describe, it, expect } from "vitest";
import { buildDsl, countConditions } from "./queryDsl";
import { coerce } from "./format";
import type { Condition, Group, SortRule } from "./types";

const cond = (
  field: string,
  ftype: Condition["ftype"],
  operator: Condition["operator"],
  value = "",
): Condition => ({ type: "cond", field, ftype, operator, value });

const grp = (op: "AND" | "OR", children: Group["children"]): Group => ({
  type: "group",
  op,
  children,
});

const base = (query: Group, extra: Partial<Parameters<typeof buildDsl>[0]> = {}) =>
  buildDsl({
    query,
    sorts: [{ field: "_score", dir: "desc" }],
    pageSize: 25,
    fields: ["a", "b"],
    ...extra,
  });

describe("coerce", () => {
  it("keeps empty string", () => expect(coerce("")).toBe(""));
  it("parses integers", () => expect(coerce("100")).toBe(100));
  it("parses negatives and decimals", () => {
    expect(coerce("-12")).toBe(-12);
    expect(coerce("3.14")).toBe(3.14);
  });
  it("parses booleans", () => {
    expect(coerce("true")).toBe(true);
    expect(coerce("false")).toBe(false);
  });
  it("leaves plain strings", () => expect(coerce("gold")).toBe("gold"));
});

describe("buildDsl — operators", () => {
  it("'is' -> term with coercion", () => {
    const q = base(grp("AND", [cond("status", "keyword", "is", "shipped")]));
    expect(q.query).toEqual({ bool: { must: [{ term: { status: "shipped" } }] } });
  });

  it("'is' coerces numeric/boolean values", () => {
    const q = base(grp("AND", [cond("captured", "boolean", "is", "true")]));
    expect(q.query).toEqual({ bool: { must: [{ term: { captured: true } }] } });
  });

  it("'is not' -> bool.must_not term", () => {
    const q = base(grp("AND", [cond("status", "keyword", "is not", "cancelled")]));
    expect(q.query).toEqual({
      bool: { must: [{ bool: { must_not: [{ term: { status: "cancelled" } }] } }] },
    });
  });

  it("'exists' -> exists", () => {
    const q = base(grp("AND", [cond("email", "keyword", "exists")]));
    expect(q.query).toEqual({ bool: { must: [{ exists: { field: "email" } }] } });
  });

  it("'contains'/'matches' -> match", () => {
    expect(base(grp("AND", [cond("name", "text", "contains", "maya")])).query).toEqual({
      bool: { must: [{ match: { name: "maya" } }] },
    });
    expect(base(grp("AND", [cond("notes", "text", "matches", "urgent")])).query).toEqual({
      bool: { must: [{ match: { notes: "urgent" } }] },
    });
  });

  it("'in' -> terms (split + trim)", () => {
    const q = base(grp("AND", [cond("tier", "keyword", "in", "gold, platinum ,silver")]));
    expect(q.query).toEqual({
      bool: { must: [{ terms: { tier: ["gold", "platinum", "silver"] } }] },
    });
  });

  it("range operators -> range with gt/lt/gte/lte and coercion", () => {
    expect(base(grp("AND", [cond("total", "long", ">", "100")])).query).toEqual({
      bool: { must: [{ range: { total: { gt: 100 } } }] },
    });
    expect(base(grp("AND", [cond("total", "long", "<", "5")])).query).toEqual({
      bool: { must: [{ range: { total: { lt: 5 } } }] },
    });
    expect(base(grp("AND", [cond("total", "long", ">=", "100")])).query).toEqual({
      bool: { must: [{ range: { total: { gte: 100 } } }] },
    });
    expect(base(grp("AND", [cond("created_at", "date", "<=", "2026-01-01")])).query).toEqual({
      bool: { must: [{ range: { created_at: { lte: "2026-01-01" } } }] },
    });
  });

  it("'has any' (nested) -> nested exists", () => {
    const q = base(grp("AND", [cond("items", "nested", "has any")]));
    expect(q.query).toEqual({
      bool: { must: [{ nested: { path: "items", query: { exists: { field: "items" } } } }] },
    });
  });
});

describe("buildDsl — groups", () => {
  it("OR -> should + minimum_should_match:1", () => {
    const q = base(
      grp("OR", [
        cond("tier", "keyword", "is", "gold"),
        cond("tier", "keyword", "is", "platinum"),
      ]),
    );
    expect(q.query).toEqual({
      bool: {
        should: [{ term: { tier: "gold" } }, { term: { tier: "platinum" } }],
        minimum_should_match: 1,
      },
    });
  });

  it("nested AND/OR composes correctly (prototype tab A)", () => {
    const q = base(
      grp("AND", [
        cond("status", "keyword", "is", "shipped"),
        cond("total", "long", ">=", "100"),
        grp("OR", [
          cond("customer.tier", "keyword", "is", "gold"),
          cond("customer.tier", "keyword", "is", "platinum"),
        ]),
        cond("created_at", "date", ">=", "2026-01-01"),
      ]),
    );
    expect(q.query).toEqual({
      bool: {
        must: [
          { term: { status: "shipped" } },
          { range: { total: { gte: 100 } } },
          {
            bool: {
              should: [
                { term: { "customer.tier": "gold" } },
                { term: { "customer.tier": "platinum" } },
              ],
              minimum_should_match: 1,
            },
          },
          { range: { created_at: { gte: "2026-01-01" } } },
        ],
      },
    });
  });
});

describe("buildDsl — sort / size / _source", () => {
  it("maps _score and field sorts", () => {
    const sorts: SortRule[] = [
      { field: "created_at", dir: "desc" },
      { field: "_score", dir: "desc" },
    ];
    const q = base(grp("AND", [cond("status", "keyword", "is", "x")]), { sorts });
    expect(q.sort).toEqual([{ created_at: { order: "desc" } }, { _score: "desc" }]);
  });

  it("passes size and _source through", () => {
    const q = base(grp("AND", [cond("status", "keyword", "is", "x")]), {
      pageSize: 50,
      fields: ["order_id", "status"],
    });
    expect(q.size).toBe(50);
    expect(q._source).toEqual(["order_id", "status"]);
  });
});

describe("buildDsl — group-by aggregation", () => {
  it("sets size:0 and a terms agg keyed by_<field>", () => {
    const q = base(grp("AND", [cond("status", "keyword", "is not", "cancelled")]), {
      groupBy: "customer.tier",
    });
    expect(q.size).toBe(0);
    expect(q.aggs).toEqual({
      by_customer_tier: { terms: { field: "customer.tier", size: 10 } },
    });
  });
});

describe("countConditions", () => {
  it("counts leaves across nested groups", () => {
    const q = grp("AND", [
      cond("a", "keyword", "is"),
      grp("OR", [cond("b", "keyword", "is"), cond("c", "keyword", "is")]),
    ]);
    expect(countConditions(q)).toBe(3);
  });
});
