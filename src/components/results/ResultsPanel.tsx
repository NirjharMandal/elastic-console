/** Results area orchestrator (prototype: renderResults). */

import { ResultsHeader } from "./ResultsHeader";
import { BucketsHeader, BucketsView } from "./BucketsView";
import { DocCard } from "./DocCard";
import { DataTable } from "./DataTable";
import { SingleDoc } from "./SingleDoc";
import { NotFound } from "./NotFound";
import { ErrorView } from "./ErrorView";
import { BulkBar } from "./BulkBar";
import { useActiveTab } from "../../stores/useTabsStore";

export function ResultsPanel() {
  const tab = useActiveTab();
  const mode = tab.mode;
  const isTable = mode === "normal" && tab.view === "table";

  let header: React.ReactNode = null;
  if (mode === "buckets") header = <BucketsHeader />;
  else if (mode === "normal") header = <ResultsHeader />;

  let body: React.ReactNode;
  if (mode === "error") body = <div style={{ padding: 18 }}><ErrorView /></div>;
  else if (mode === "notfound") body = <div style={{ padding: 18 }}><NotFound /></div>;
  else if (mode === "single") body = <div style={{ padding: 16 }}><SingleDoc /></div>;
  else if (mode === "buckets") body = <div style={{ padding: 16 }}><BucketsView /></div>;
  else if (isTable)
    body = (
      <div style={{ flex: 1, minHeight: 0, padding: "14px 16px", display: "flex" }}>
        <DataTable />
      </div>
    );
  else if (tab.result.hits.length === 0)
    body = (
      <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
        No results · run a query (⌘↵) to fetch documents.
      </div>
    );
  else
    body = (
      <div style={{ padding: "14px 16px" }}>
        {tab.result.hits.map((d) => (
          <DocCard key={d._id} doc={d} prefix="t" />
        ))}
      </div>
    );

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {header}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: isTable ? "hidden" : "auto",
          display: isTable ? "flex" : "block",
          flexDirection: "column",
        }}
      >
        {body}
      </div>
      <BulkBar />
    </div>
  );
}
