/** Single-document retrieval view (prototype: renderSingle). */

import { DocCard } from "./DocCard";
import { useActiveTab } from "../../stores/useTabsStore";

export function SingleDoc() {
  const tab = useActiveTab();
  const doc = tab.fetchedDoc ?? null;

  if (!doc) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--faint)", fontSize: 12.5 }}>
        No document loaded · use the _id lookup to fetch one.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Document retrieved</span>
        <span style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'IBM Plex Mono', monospace" }}>
          GET /{tab.index}/_doc/{doc._id}
        </span>
      </div>
      <DocCard doc={doc} prefix="s" />
    </div>
  );
}
