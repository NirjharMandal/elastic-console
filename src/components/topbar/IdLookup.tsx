/** Direct _id lookup input + Fetch button (prototype: header lookup + fetchDoc). */

import { useActiveConn } from "../../stores/useConnStore";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import { getDoc } from "../../services/source";

export function IdLookup() {
  const tab = useActiveTab();
  const conn = useActiveConn();
  const patchActive = useTabsStore((s) => s.patchActive);

  const fetchDoc = async () => {
    const id = tab.lookupId.trim();
    if (!id || !conn || !tab.index) return;
    const doc = await getDoc(conn, tab.index, id);
    patchActive({
      mode: doc ? "single" : "notfound",
      foundId: doc ? doc._id : null,
      fetchedDoc: doc,
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", marginLeft: 1 }}>
      <input
        value={tab.lookupId}
        onChange={(e) => patchActive({ lookupId: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") void fetchDoc();
        }}
        placeholder="_id lookup…"
        style={{
          width: 138,
          background: "var(--elev)",
          border: "1px solid var(--border)",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          padding: "5px 9px",
          color: "var(--text)",
          font: "inherit",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={() => void fetchDoc()}
        style={{
          background: "var(--sunken)",
          border: "1px solid var(--border)",
          borderRadius: "0 8px 8px 0",
          padding: "5px 12px",
          color: "var(--text)",
          font: "inherit",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Fetch
      </button>
    </div>
  );
}
