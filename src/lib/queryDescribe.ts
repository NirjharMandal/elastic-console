/**
 * Render a compact human description of a query tree (for history entries),
 * e.g. "status = shipped AND total ≥ 100". Pure, UI-free.
 */

import type { Group, Operator, QueryNode } from "./types";

const OP_SYM: Record<Operator, string> = {
  is: "=",
  "is not": "≠",
  contains: "~",
  matches: "~",
  in: "in",
  exists: "exists",
  ">": ">",
  "<": "<",
  ">=": "≥",
  "<=": "≤",
  "has any": "has any",
};

function describeNode(node: QueryNode): string {
  if (node.type === "group") return "(" + describeGroup(node) + ")";
  const sym = OP_SYM[node.operator] ?? node.operator;
  if (node.operator === "exists") return `${node.field} exists`;
  if (node.operator === "has any") return `${node.field} has any`;
  return `${node.field} ${sym} ${node.value}`.trim();
}

function describeGroup(g: Group): string {
  const join = ` ${g.op} `;
  return g.children.map(describeNode).join(join);
}

export function describeQuery(g: Group): string {
  const s = describeGroup(g);
  return s || "(empty query)";
}
