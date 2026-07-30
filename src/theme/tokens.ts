/**
 * Design tokens — TypeScript mirror of src/styles/theme.css.
 *
 * Components reference the live CSS variables (e.g. `var(--panel)`) so they stay
 * theme-aware at runtime. This module centralizes the *semantic* maps that the
 * prototype encoded in JS (field-type colors, env/health colors, group-depth
 * colors) plus the raw hex values for both themes for reference/tests.
 */

export type ThemeName = "light" | "dark";

/** Field types Elasticsearch mappings surface in this app. */
export type FieldType =
  | "keyword"
  | "text"
  | "long"
  | "date"
  | "boolean"
  | "nested";

/** CSS-variable reference helper, e.g. `cssVar("panel")` -> "var(--panel)". */
export const cssVar = (name: string): string => `var(--${name})`;

/** Field-type badge colors (prototype: TYPE_COLOR). */
export const TYPE_COLOR: Record<FieldType, string> = {
  keyword: "var(--g0)",
  text: "var(--blue)",
  long: "var(--jnum)",
  date: "var(--g1)",
  boolean: "var(--jbool)",
  nested: "var(--g2)",
};

/** Connection environment accent colors (prototype: ENV_COLOR). */
export const ENV_COLOR: Record<string, string> = {
  prod: "var(--red)",
  staging: "var(--yellow)",
  dev: "var(--blue)",
};

/** Cluster health colors (prototype: HEALTH_COLOR). */
export const HEALTH_COLOR: Record<string, string> = {
  green: "var(--green)",
  yellow: "var(--yellow)",
  red: "var(--red)",
};

/** Group-builder depth colors; cycles every 3 levels (prototype: depth % 3). */
export const DEPTH_COLORS = ["var(--g0)", "var(--g1)", "var(--g2)"] as const;

/** color-mix helper preserving the prototype's translucent tints. */
export const mix = (color: string, pct: number, base = "transparent"): string =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`;

/** Raw hex values, both themes — kept for reference & potential canvas/export use. */
export const LIGHT_TOKENS = {
  bg: "#f3f0e8",
  panel: "#fbfaf6",
  elev: "#ffffff",
  sunken: "#ece8dd",
  border: "#e4dfd2",
  "border-strong": "#d6cfbe",
  hover: "#eeeae0",
  text: "#23221d",
  dim: "#6c685d",
  faint: "#9a958a",
  accent: "#23221d",
  "accent-text": "#fbfaf6",
  "accent-soft": "#e9e4d7",
  green: "#4a9d6f",
  yellow: "#bf9230",
  red: "#bf5446",
  blue: "#3a6ea5",
  g0: "#3f8f86",
  g1: "#b07f3a",
  g2: "#8a6aa0",
  jkey: "#3a6ea5",
  jstr: "#4f7a3f",
  jnum: "#a0592c",
  jbool: "#7a4fa0",
  jnull: "#9a958a",
  jpunc: "#a39e90",
  mark: "#f1e3a8",
} as const;

export const DARK_TOKENS = {
  bg: "#15140f",
  panel: "#1b1a14",
  elev: "#211f18",
  sunken: "#100f0b",
  border: "#2c2a21",
  "border-strong": "#3b382c",
  hover: "#26241c",
  text: "#ece8dd",
  dim: "#a39d8d",
  faint: "#6e695b",
  accent: "#ece8dd",
  "accent-text": "#15140f",
  "accent-soft": "#2c2a21",
  green: "#5cab7e",
  yellow: "#cda23f",
  red: "#cf6757",
  blue: "#7aa2d6",
  g0: "#5aa79d",
  g1: "#c69a52",
  g2: "#a587bb",
  jkey: "#7aa2d6",
  jstr: "#94bd78",
  jnum: "#d9a05b",
  jbool: "#b591d4",
  jnull: "#6e695b",
  jpunc: "#5f5b4e",
  mark: "#4d4520",
} as const;
