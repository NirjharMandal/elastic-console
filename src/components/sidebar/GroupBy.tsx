/** Group-by terms-aggregation selector (prototype: groupBody). */

import { Dropdown } from "../common/Dropdown";
import { resolveGroupFields } from "../../services/schema";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import { useRunQuery } from "../../hooks/useRunQuery";

export function GroupBy() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);
  const run = useRunQuery();
  const opts = resolveGroupFields(tab);

  const onChange = (v: string) => {
    const g = v || null;
    patchActive({ groupBy: g });
    // Re-run so aggregation buckets (or plain hits) load immediately.
    run();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Dropdown
        ddKey="groupby"
        value={tab.groupBy ?? ""}
        options={opts}
        onChange={(v) => onChange(String(v))}
        mono
        flex={1}
        full
        color={tab.groupBy ? "var(--g2)" : "var(--faint)"}
      />
      {tab.groupBy && <span style={{ fontSize: 11, color: "var(--faint)" }}>terms agg</span>}
    </div>
  );
}
