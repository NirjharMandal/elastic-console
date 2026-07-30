/** Sort rules editor (prototype: sortRows + addSort). */

import { Dropdown } from "../common/Dropdown";
import { Segmented } from "../common/Segmented";
import { resolveSortFields } from "../../services/schema";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import type { SortRule } from "../../lib/types";

export function SortRules() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);
  const opts = resolveSortFields(tab);

  const update = (i: number, patch: Partial<SortRule>) =>
    patchActive({ sorts: tab.sorts.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const remove = (i: number) =>
    patchActive({ sorts: tab.sorts.filter((_, idx) => idx !== i) });
  const add = () =>
    patchActive({ sorts: [...tab.sorts, { field: "total", dir: "desc" }] });

  return (
    <div>
      {tab.sorts.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
          <span
            style={{
              width: 16,
              textAlign: "center",
              color: "var(--faint)",
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {i + 1}
          </span>
          <Dropdown
            ddKey={"sort." + i}
            value={s.field}
            options={opts}
            onChange={(v) => update(i, { field: String(v) })}
            mono
            flex={1}
            full
            color={s.field === "_score" ? "var(--blue)" : "var(--text)"}
          />
          <Segmented<"asc" | "desc">
            value={s.dir}
            onChange={(dir) => update(i, { dir })}
            radius={6}
            padding="4px 9px"
            fontSize={11}
            mono
            options={[
              { value: "asc", label: "↑" },
              { value: "desc", label: "↓" },
            ]}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              width: 20,
              height: 20,
              border: "none",
              background: "transparent",
              color: "var(--faint)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--dim)",
          borderRadius: 6,
          padding: "4px 9px",
          font: "inherit",
          fontSize: 11,
          fontWeight: 500,
          cursor: "pointer",
          marginTop: 6,
        }}
      >
        + add sort rule
      </button>
    </div>
  );
}
