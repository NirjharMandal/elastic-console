/** A single condition row (prototype: renderCond). */

import { Dropdown } from "../common/Dropdown";
import { FieldBadge } from "./FieldBadge";
import { opsFor, typeOf } from "../../lib/format";
import { getNode, getParent } from "../../lib/treeOps";
import { useTabsStore } from "../../stores/useTabsStore";
import type { Condition, Field, Operator } from "../../lib/types";

interface ConditionRowProps {
  node: Condition;
  path: number[];
  fields: Field[];
}

export function ConditionRow({ node, path, fields }: ConditionRowProps) {
  const mutateQuery = useTabsStore((s) => s.mutateQuery);
  const ops = opsFor(node.ftype);
  const operator = ops.includes(node.operator) ? node.operator : ops[0];
  const key = "q." + path.join(".");

  const updateField = (v: string) =>
    mutateQuery((q) => {
      const n = getNode(q, path) as Condition;
      n.field = v;
      n.ftype = typeOf(v, fields);
      const next = opsFor(n.ftype);
      if (!next.includes(n.operator)) n.operator = next[0];
    });

  const updateOp = (v: Operator) =>
    mutateQuery((q) => {
      (getNode(q, path) as Condition).operator = v;
    });

  const updateValue = (v: string) =>
    mutateQuery((q) => {
      (getNode(q, path) as Condition).value = v;
    });

  const remove = () =>
    mutateQuery((q) => {
      const parent = getParent(q, path);
      parent.children.splice(path[path.length - 1], 1);
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 0",
        flexWrap: "wrap",
      }}
    >
      <Dropdown
        ddKey={key + ".f"}
        value={node.field}
        options={fields.map((f) => f.f)}
        onChange={(v) => updateField(String(v))}
        mono
        maxWidth={152}
      />
      <FieldBadge ftype={node.ftype} />
      <Dropdown
        ddKey={key + ".o"}
        value={operator}
        options={ops}
        onChange={(v) => updateOp(v as Operator)}
        mono
        minWidth={46}
        color="var(--blue)"
      />
      {operator === "exists" ? (
        <span style={{ flex: 1, color: "var(--faint)", fontSize: 11, fontStyle: "italic", paddingLeft: 4 }}>
          field present
        </span>
      ) : (
        <input
          value={node.value}
          onChange={(e) => updateValue(e.target.value)}
          placeholder="value"
          style={{
            flex: 1,
            minWidth: 46,
            width: 46,
            background: "var(--sunken)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 6,
            padding: "5px 8px",
            font: "inherit",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            outline: "none",
          }}
        />
      )}
      <button
        type="button"
        title="remove"
        onClick={remove}
        style={{
          flex: "none",
          width: 22,
          height: 22,
          borderRadius: 5,
          border: "1px solid transparent",
          background: "transparent",
          color: "var(--faint)",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}
