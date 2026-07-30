/** Left query-builder sidebar (prototype: aside + renderSidebarBody + footer). */

import { Section } from "../sidebar/Section";
import { SortRules } from "../sidebar/SortRules";
import { GroupBy } from "../sidebar/GroupBy";
import { LibraryRow } from "../sidebar/LibraryRow";
import { QueryGroup } from "../builder/QueryGroup";
import { JsonDslView } from "../builder/JsonDslView";
import { resolveFields } from "../../services/schema";
import { useActiveTab, useTabsStore } from "../../stores/useTabsStore";
import { useUiStore } from "../../stores/useUiStore";
import { useRunQuery } from "../../hooks/useRunQuery";

function JsonSwitch() {
  const tab = useActiveTab();
  const patchActive = useTabsStore((s) => s.patchActive);
  const sw = tab.jsonToggle;
  return (
    <div
      onClick={() => patchActive({ jsonToggle: !sw })}
      style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
    >
      <span style={{ fontSize: 11, color: sw ? "var(--text)" : "var(--faint)", fontWeight: 500 }}>
        View as JSON
      </span>
      <div
        style={{
          width: 30,
          height: 17,
          borderRadius: 9,
          background: sw ? "var(--accent)" : "var(--border-strong)",
          position: "relative",
          transition: "all .15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: sw ? 15 : 2,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: sw ? "var(--accent-text)" : "var(--panel)",
            transition: "all .15s",
          }}
        />
      </div>
    </div>
  );
}

export function Sidebar() {
  const tab = useActiveTab();
  const width = useUiStore((s) => s.sidebarWidth);
  const patchActive = useTabsStore((s) => s.patchActive);
  const run = useRunQuery();
  const fields = resolveFields(tab);

  const clearQuery = () => {
    patchActive({
      groupBy: null,
      mode: "normal",
      query: {
        type: "group",
        op: "AND",
        children: [{ type: "cond", field: "", ftype: "keyword", operator: "is", value: "" }],
      },
    });
    run();
  };

  return (
    <aside
      style={{
        width,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "var(--panel)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Section title="Query" right={<JsonSwitch />}>
          {tab.jsonToggle ? (
            <JsonDslView />
          ) : (
            <QueryGroup node={tab.query} path={[]} depth={0} fields={fields} />
          )}
        </Section>
        <Section title="Sort">
          <SortRules />
        </Section>
        <Section title="Group by">
          <GroupBy />
        </Section>
        <Section title="Library">
          <LibraryRow />
        </Section>
      </div>

      <div
        style={{
          flex: "none",
          padding: 10,
          borderTop: "1px solid var(--border)",
          background: "var(--panel)",
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => run()}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 9,
            background: "var(--accent)",
            color: "var(--accent-text)",
            border: "none",
            borderRadius: 8,
            font: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Run query
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.6 }}>⌘↵</span>
        </button>
        <button
          type="button"
          onClick={clearQuery}
          style={{
            padding: "9px 16px",
            background: "transparent",
            color: "var(--dim)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            font: "inherit",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>
    </aside>
  );
}
