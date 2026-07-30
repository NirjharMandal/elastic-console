import { describe, it, expect } from "vitest";
import { coerce, fmtNum, gv, opsFor, tsAnnotate, typeOf } from "./format";
import type { Field } from "./types";

describe("fmtNum / gv / typeOf", () => {
  it("formats with thousands separators", () => {
    expect(fmtNum(1204883)).toBe("1,204,883");
  });
  it("reads nested paths", () => {
    expect(gv({ a: { b: { c: 5 } } }, "a.b.c")).toBe(5);
    expect(gv({ a: null }, "a.b")).toBe(null);
  });
  it("resolves field types with keyword fallback", () => {
    const fields: Field[] = [{ f: "age", t: "long" }];
    expect(typeOf("age", fields)).toBe("long");
    expect(typeOf("unknown", fields)).toBe("keyword");
  });
});

describe("opsFor", () => {
  it("range ops only for numeric/date", () => {
    expect(opsFor("long")).toContain(">=");
    expect(opsFor("date")).toContain("<");
    expect(opsFor("keyword")).not.toContain(">=");
    expect(opsFor("boolean")).toEqual(["is", "exists"]);
    expect(opsFor("nested")).toEqual(["has any", "exists"]);
  });
});

describe("tsAnnotate", () => {
  const now = 1750873000000; // fixed reference instant

  it("annotates 10-digit epoch seconds (×1000)", () => {
    const a = tsAnnotate(1750872400, false, now);
    expect(a).not.toBeNull();
    expect(a!.ms).toBe(1750872400 * 1000);
    expect(a!.absolute).toContain(" at ");
    expect(typeof a!.relative).toBe("string");
  });

  it("annotates 13-digit epoch milliseconds", () => {
    const a = tsAnnotate(1750872400000, false, now);
    expect(a!.ms).toBe(1750872400000);
  });

  it("annotates all-digit string timestamps", () => {
    expect(tsAnnotate("1750872400", false, now)!.ms).toBe(1750872400 * 1000);
    expect(tsAnnotate("1750872400000", false, now)!.ms).toBe(1750872400000);
  });

  it("annotates ISO-8601 date strings", () => {
    const a = tsAnnotate("2026-05-14T09:23:11Z", false, now);
    expect(a).not.toBeNull();
    expect(a!.ms).toBe(Date.parse("2026-05-14T09:23:11Z"));
  });

  it("does NOT mutate / annotate non-timestamps", () => {
    expect(tsAnnotate("ORD-10482", false, now)).toBeNull();
    expect(tsAnnotate("gold", false, now)).toBeNull();
    expect(tsAnnotate(34, false, now)).toBeNull(); // age
    expect(tsAnnotate(1284, false, now)).toBeNull(); // sessions (4 digits)
    expect(tsAnnotate(248.5, false, now)).toBeNull(); // total
    expect(tsAnnotate(null, false, now)).toBeNull();
    expect(tsAnnotate(true, false, now)).toBeNull();
  });
});

describe("coerce (re-exported behavior)", () => {
  it("coerces consistently", () => {
    expect(coerce("100")).toBe(100);
    expect(coerce("true")).toBe(true);
    expect(coerce("x")).toBe("x");
  });
});
