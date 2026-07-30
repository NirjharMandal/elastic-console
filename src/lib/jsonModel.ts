/**
 * Pure JSON -> flat-row model (prototype: renderJson, restructured for
 * virtualization). Flattening a value into one row per visual line lets the
 * results tree render large documents through react-window while preserving the
 * prototype's collapse behavior, token colors, highlight, and — new — the
 * epoch-timestamp annotation.
 */

import { tsAnnotate, type TsAnnotation } from "./format";

export type SegKind = "key" | "punc" | "value" | "summary";

export interface Seg {
  kind: SegKind;
  text: string;
  /** value color css var (only for kind === "value"). */
  color?: string;
  /** highlight (mark) background for matched strings. */
  hl?: boolean;
  /** timestamp annotation appended after a value (visualization only). */
  ts?: TsAnnotation | null;
}

export interface FlatRow {
  /** unique key for react reconciliation. */
  id: string;
  /** indentation level (× 18px in the renderer). */
  depth: number;
  /** path used for collapse toggling (objects/arrays only). */
  togglePath?: string;
  collapsed?: boolean;
  segs: Seg[];
}

export interface FlattenOpts {
  collapsed: Set<string>;
  /** returns true when a string value should be highlighted (mark). */
  highlight?: (s: string) => boolean;
  /** enable timestamp annotation on values. */
  annotateTime?: boolean;
  /** "now" injection for deterministic tests. */
  now?: number;
}

function keySegs(keyLabel: string | null): Seg[] {
  if (keyLabel == null) return [];
  return [
    { kind: "key", text: JSON.stringify(keyLabel) },
    { kind: "punc", text: ": " },
  ];
}

function valueSeg(value: unknown, opts: FlattenOpts): Seg {
  if (value === null) return { kind: "value", text: "null", color: "var(--jnull)" };
  if (typeof value === "number")
    return {
      kind: "value",
      text: String(value),
      color: "var(--jnum)",
      ts: opts.annotateTime ? tsAnnotate(value, false, opts.now) : null,
    };
  if (typeof value === "boolean")
    return { kind: "value", text: String(value), color: "var(--jbool)" };
  // string
  const s = value as string;
  return {
    kind: "value",
    text: JSON.stringify(s),
    color: "var(--jstr)",
    hl: opts.highlight ? opts.highlight(s) : false,
    ts: opts.annotateTime ? tsAnnotate(s, false, opts.now) : null,
  };
}

let rowSeq = 0;

/**
 * Flatten a JSON value into display rows. `keyLabel` labels object entries;
 * pass null for array elements / the root.
 */
export function flattenJson(
  value: unknown,
  path: string,
  keyLabel: string | null,
  opts: FlattenOpts,
  depth = 0,
): FlatRow[] {
  const isArr = Array.isArray(value);
  const isObj = !isArr && value != null && typeof value === "object";

  if (isArr || isObj) {
    const entries: [string | number, unknown][] = isArr
      ? (value as unknown[]).map((v, i) => [i, v])
      : Object.entries(value as Record<string, unknown>);
    const collapsed = opts.collapsed.has(path);
    const open = isArr ? "[" : "{";
    const close = isArr ? "]" : "}";

    if (collapsed) {
      return [
        {
          id: `r${rowSeq++}`,
          depth,
          togglePath: path,
          collapsed: true,
          segs: [
            ...keySegs(keyLabel),
            { kind: "punc", text: open },
            {
              kind: "summary",
              text: ` ${entries.length} ${isArr ? "items" : "keys"} `,
            },
            { kind: "punc", text: close },
          ],
        },
      ];
    }

    const head: FlatRow = {
      id: `r${rowSeq++}`,
      depth,
      togglePath: path,
      collapsed: false,
      segs: [...keySegs(keyLabel), { kind: "punc", text: open }],
    };

    const childRows: FlatRow[] = [];
    entries.forEach(([k, v], i) => {
      const rows = flattenJson(
        v,
        path + "." + k,
        isArr ? null : String(k),
        opts,
        depth + 1,
      );
      // trailing comma after the last line of every entry but the last
      if (i < entries.length - 1 && rows.length > 0) {
        rows[rows.length - 1].segs.push({ kind: "punc", text: "," });
      }
      childRows.push(...rows);
    });

    const tail: FlatRow = {
      id: `r${rowSeq++}`,
      depth,
      segs: [{ kind: "punc", text: close }],
    };

    return [head, ...childRows, tail];
  }

  // primitive leaf
  return [
    {
      id: `r${rowSeq++}`,
      depth,
      segs: [...keySegs(keyLabel), valueSeg(value, opts)],
    },
  ];
}
