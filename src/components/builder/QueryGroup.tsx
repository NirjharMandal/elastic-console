/** Nested AND/OR group with depth indicators (prototype: renderGroup). */

import type { CSSProperties } from "react";
import { Segmented } from "../common/Segmented";
import { ConditionRow } from "./ConditionRow";
import { DEPTH_COLORS, mix } from "../../theme/tokens";
import { getNode, getParent } from "../../lib/treeOps";
import { useTabsStore } from "../../stores/useTabsStore";
import type { Field, Group } from "../../lib/types";

interface QueryGroupProps {
  node: Group;
  path: number[];
  depth: number;
  fields: Field[];
}

const miniBtnStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--dim)",
  borderRadius: 6,
  padding: "3px 8px",
  font: "inherit",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export function QueryGroup({ node, path, depth, fields }: QueryGroupProps) {
  const mutateQuery = useTabsStore((s) => s.mutateQuery);
  const c = DEPTH_COLORS[depth % 3];

  const setOp = (op: "AND" | "OR") =>
    mutateQuery((q) => {
      (getNode(q, path) as Group).op = op;
    });

  const addCond = () =>
    mutateQuery((q) => {
      (getNode(q, path) as Group).children.push({
        type: "cond",
        field: "status",
        ftype: "keyword",
        operator: "is",
        value: "",
      });
    });

  const addGrp = () =>
    mutateQuery((q) => {
      (getNode(q, path) as Group).children.push({
        type: "group",
        op: "AND",
        children: [
          { type: "cond", field: "customer.tier", ftype: "keyword", operator: "is", value: "" },
        ],
      });
    });

  const removeGroup = () =>
    mutateQuery((q) => {
      const parent = getParent(q, path);
      parent.children.splice(path[path.length - 1], 1);
    });

  const wrap: CSSProperties =
    depth > 0
      ? {
          borderLeft: `2px solid ${c}`,
          marginTop: 7,
          background: mix(c, 5),
          borderRadius: "0 7px 7px 0",
          padding: "7px 8px 7px 11px",
        }
      : {};

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Segmented<"AND" | "OR">
          value={node.op}
          onChange={setOp}
          borderColor={c}
          radius={6}
          padding="2px 9px"
          fontSize={11}
          fontWeight={700}
          mono
          activeColor="#fff"
          activeBg={c}
          inactiveColor={c}
          options={[
            { value: "AND", label: "AND" },
            { value: "OR", label: "OR" },
          ]}
        />
        <span style={{ fontSize: 11, color: "var(--faint)" }}>
          {node.op === "OR" ? "match any of" : "match all of"}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" style={miniBtnStyle} onClick={addCond}>
          + condition
        </button>
        <button type="button" style={miniBtnStyle} onClick={addGrp}>
          + group
        </button>
        {depth > 0 && (
          <button
            type="button"
            title="remove group"
            onClick={removeGroup}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--faint)",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {node.children.map((ch, i) =>
        ch.type === "group" ? (
          <QueryGroup key={i} node={ch} path={[...path, i]} depth={depth + 1} fields={fields} />
        ) : (
          <ConditionRow key={i} node={ch} path={[...path, i]} fields={fields} />
        ),
      )}
    </div>
  );
}
