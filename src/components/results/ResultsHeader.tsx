/** Results toolbar: hit count, view toggle, page size + pager (prototype: resultsHeader). */

import { Dropdown } from "../common/Dropdown";
import { Segmented } from "../common/Segmented";
import { RefreshButton } from "../topbar/RefreshButton";
import { ReturnFields } from "../sidebar/ReturnFields";
import { fmtNum } from "../../lib/format";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import { useRunQuery } from "../../hooks/useRunQuery";
import type { ResultView } from "../../lib/types";

function PagerBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: disabled ? "var(--faint)" : "var(--text)",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

export function ResultsHeader() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);
  const run = useRunQuery();

  const total = tab.result.total;
  const ps = tab.pageSize;
  const pg = tab.page;
  const start = (pg - 1) * ps + 1;
  const end = Math.min(pg * ps, total);

  const goToPage = (p: number) => {
    patchActive({ page: p });
    run({ resetPage: false });
  };

  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtNum(total)}</span>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>hits in</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--green)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {tab.result.took}ms
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <Segmented<ResultView>
        value={tab.view}
        onChange={(v) => patchActive({ view: v })}
        radius={7}
        padding="5px 12px"
        fontSize={12}
        options={[
          { value: "tree", label: "JSON tree" },
          { value: "table", label: "Table" },
        ]}
      />
      <ReturnFields />
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 11.5, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtNum(start)}–{fmtNum(end)} of {fmtNum(total)}
        </span>
        <Dropdown
          ddKey="pagesize"
          value={ps}
          options={[
            [25, "25 / page"],
            [50, "50 / page"],
            [100, "100 / page"],
          ]}
          onChange={(v) => {
            patchActive({ pageSize: Number(v) });
            run();
          }}
          fontSize={11.5}
        />
        <PagerBtn label="‹" onClick={() => goToPage(Math.max(1, pg - 1))} disabled={pg <= 1} />
        <PagerBtn label="›" onClick={() => goToPage(pg + 1)} disabled={end >= total} />
      </div>
      <RefreshButton />
    </div>
  );
}
