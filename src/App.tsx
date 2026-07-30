import { useEffect } from "react";
import { Header } from "./components/layout/Header";
import { TabStrip } from "./components/layout/TabStrip";
import { Sidebar } from "./components/layout/Sidebar";
import { ResizeHandle } from "./components/layout/ResizeHandle";
import { ResultsPanel } from "./components/results/ResultsPanel";
import { DropdownMenu } from "./components/common/Dropdown";
import { IndexMenu } from "./components/topbar/IndexMenu";
import { SavedQueriesModal } from "./components/overlays/SavedQueriesModal";
import { ConnectionsModal } from "./components/overlays/ConnectionsModal";
import { useUiStore } from "./stores/useUiStore";
import { useConnStore } from "./stores/useConnStore";
import { useRunQuery } from "./hooks/useRunQuery";

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const hydrateConn = useConnStore((s) => s.hydrate);
  const run = useRunQuery();

  // Hydrate persisted settings + connections once.
  useEffect(() => {
    void hydrateUi();
    void hydrateConn();
  }, [hydrateUi, hydrateConn]);

  // Apply theme to <html> so :root / [data-theme="dark"] vars + body bg switch.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ⌘↵ / Ctrl+↵ runs the active query.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
        fontSize: 13,
        overflow: "hidden",
        letterSpacing: "-0.005em",
      }}
    >
      <Header />
      <TabStrip />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar />
        <ResizeHandle />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "var(--bg)",
          }}
        >
          <ResultsPanel />
        </main>
      </div>

      <SavedQueriesModal />
      <ConnectionsModal />
      <IndexMenu />
      <DropdownMenu />
    </div>
  );
}
