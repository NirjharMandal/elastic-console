/** Navigate a query tree by an index path (sequence of child indices). */

import type { Group, QueryNode } from "./types";

/** The node at `path` ([] === root). */
export function getNode(root: Group, path: number[]): QueryNode {
  let node: QueryNode = root;
  for (const i of path) {
    node = (node as Group).children[i];
  }
  return node;
}

/** The group that directly contains the node at `path`. */
export function getParent(root: Group, path: number[]): Group {
  return getNode(root, path.slice(0, -1)) as Group;
}
