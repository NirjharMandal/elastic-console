/**
 * Pure formatting + small query helpers. No React, no I/O.
 */

import type { FieldType, Field, Operator } from "./types";

/** Thousands-separated integer (prototype: fmtNum). */
export const fmtNum = (n: number): string => n.toLocaleString("en-US");

/**
 * Coerce a string value to number / boolean / string (prototype: coerce).
 * Used when building term/range clauses so `"100"` becomes `100`, etc.
 */
export const coerce = (v: string): string | number | boolean => {
  if (v === "") return v;
  if (/^-?\d+(\.\d+)?$/.test(v)) return +v;
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
};

/** Read a value from an object by dot-path (prototype: gv). */
export const gv = (obj: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (a, k) =>
        a == null ? a : (a as Record<string, unknown>)[k],
      obj,
    );

/** Operators available for a field type (prototype: opsFor). */
export const opsFor = (t: FieldType | string): Operator[] => {
  switch (t) {
    case "keyword":
      return ["is", "is not", "contains", "in", "exists"];
    case "text":
      return ["contains", "matches", "exists"];
    case "long":
    case "date":
      return ["is", "is not", ">", "<", ">=", "<=", "in", "exists"];
    case "boolean":
      return ["is", "exists"];
    case "nested":
      return ["has any", "exists"];
    default:
      return ["is", "exists"];
  }
};

/** Resolve a field's type from a known field list (prototype: typeOf). */
export const typeOf = (field: string, fields: Field[]): FieldType => {
  const e = fields.find((x) => x.f === field);
  return e ? e.t : "keyword";
};

// ---------------------------------------------------------------------------
//  Timestamp annotation (visualization only — never mutates underlying data)
// ---------------------------------------------------------------------------

export interface TsAnnotation {
  /** Epoch milliseconds the value resolves to. */
  ms: number;
  /** e.g. "6 minutes ago" / "in 2 days". */
  relative: string;
  /** e.g. "Thu, Jun 25, 2026 at 6:10:37 PM". */
  absolute: string;
}

const REL = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const REL_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
  ["second", 1000],
];

function relativeFrom(ms: number, now: number): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  for (const [unit, span] of REL_UNITS) {
    if (abs >= span || unit === "second") {
      return REL.format(Math.round(diff / span), unit);
    }
  }
  return REL.format(0, "second");
}

/**
 * Detect epoch timestamps (10-digit seconds, 13-digit milliseconds) and
 * ISO-8601 date strings, and produce a display annotation. Returns null when
 * the value is not recognizably a timestamp.
 *
 * `isDateField` lets date-typed mapping fields opt in even when the raw value
 * is a parseable date string of non-standard length.
 */
export function tsAnnotate(
  value: unknown,
  isDateField = false,
  now: number = Date.now(),
): TsAnnotation | null {
  let ms: number | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const digits = Math.trunc(Math.abs(value)).toString().length;
    if (digits === 13) ms = value;
    else if (digits === 10) ms = value * 1000;
  } else if (typeof value === "string") {
    if (/^\d{13}$/.test(value)) ms = Number(value);
    else if (/^\d{10}$/.test(value)) ms = Number(value) * 1000;
    else if (
      (isDateField || /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})/.test(value)) &&
      value.trim() !== ""
    ) {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) ms = parsed;
    }
  }

  if (ms == null) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;

  return {
    ms,
    relative: relativeFrom(ms, now),
    absolute: `${DATE_FMT.format(d)} at ${TIME_FMT.format(d)}`,
  };
}
