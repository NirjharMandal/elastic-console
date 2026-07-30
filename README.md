# Elastic Console

A native **macOS** desktop console for browsing and querying **Elasticsearch**, built with
Tauri v2 + React 19. Visual query builder, type-aware operators, live Elasticsearch Query DSL
preview, JSON-tree / table results, aggregations, saved queries & history, a multi-cluster
connection manager, and dark/light themes.

> Personal, local-use app. The WebView never talks to Elasticsearch directly — **all** cluster
> I/O goes through a thin Rust command layer (`reqwest`), and credentials live in the macOS
> Keychain, never in the frontend.

---

## Features

- **Searchable index selector** (typeahead with live doc counts) and a cluster status indicator.
- **Direct `_id` lookup** (single-doc fetch) with a readable not-found state.
- **Visual query builder** — condition rows (field + type-aware operator + value), nested AND/OR
  groups with colored depth indicators, add-condition / add-group per group.
- **Field-type awareness** — keyword/text/long/date/boolean/nested badges; the operator list adapts
  to the field type (range operators only for numeric/date).
- **Read-only generated DSL** — "View as JSON" toggle, copyable.
- **Sort rules**, **group-by aggregation** (terms buckets), **return-field** multi-select chips.
- **Save/load named queries** + **auto-tracked history** (SQLite).
- **Results** — JSON tree ↔ table toggle (both virtualized with react-window), per-doc metadata,
  per-doc actions (copy/expand/raw), bulk select + export, pagination with hit count + exec time.
- **Epoch-timestamp annotation** — 10-digit (seconds) / 13-digit (ms) epoch values and ISO dates get
  a read-only `🕐 relative · ⏱️ absolute` comment after the value (visualization only; never mutates data).
- **Readable Elasticsearch error** rendering (type / reason / caused_by / shard / node).
- **Dark / light theme** (default **light**, persisted), independent multi-tab query sessions.

The UI is a pixel-faithful rebuild of the design prototype; all design tokens live in
[`src/styles/theme.css`](src/styles/theme.css) + [`src/theme/tokens.ts`](src/theme/tokens.ts).

---

## Stack

Tauri v2 · React 19 + TypeScript 5 + Vite · Tailwind CSS v4 · Zustand 5 · tauri-specta (type-safe
Rust↔TS bridge) · react-window (virtualization) · Rust + `reqwest` (ES transport) · `keyring`
(Keychain) · `tauri-plugin-sql` (SQLite).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 18+ (tested on 22) | <https://nodejs.org> or `nvm install 22` |
| **Rust** | stable (tested on 1.96) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Xcode Command Line Tools** | latest | `xcode-select --install` |

---

## Develop

```bash
npm install
npm run tauri dev      # launches the native app with hot-reload
```

`npm run tauri dev` starts Vite and compiles the Rust shell. The first Rust build downloads and
compiles dependencies and takes a few minutes; subsequent runs are fast. In debug mode the app
regenerates the type-safe command bridge at `src/bindings.ts` via tauri-specta.

You can also preview just the UI in a browser (sample data, no Rust) with `npm run dev`.

### Tests

```bash
npm run test           # vitest — the pure DSL translation + formatting helpers
```

---

## Build a distributable

```bash
npm run tauri build    # produces a double-clickable .app and a .dmg
```

Output:

```
src-tauri/target/release/bundle/macos/Elastic Console.app
src-tauri/target/release/bundle/dmg/Elastic Console_0.1.0_aarch64.dmg
```

### First launch (Gatekeeper) — unsigned build

The default build is **unsigned**, so on first launch macOS Gatekeeper will refuse to open it with
a "cannot be opened because it is from an unidentified developer" message. To run it:

1. **Right-click** (or Control-click) the app → **Open**.
2. In the dialog, click **Open** again.

You only need to do this once. (CLI equivalent: `xattr -dr com.apple.quarantine "/Applications/Elastic Console.app"`.)

---

## Connecting to Elasticsearch

The app ships with **sample data** (the `orders` and `users` indices) so the whole UI renders before
you connect anything. To point at a real cluster:

1. Click the cluster button in the top bar → **Connections** → **Use** the `localhost` connection,
   or **+ New connection**.
2. Set the **Host URL** (e.g. `http://localhost:9200`), **Authentication** (None / Basic / API key),
   and **Test connection**.
3. Credentials you enter are stored in the **macOS Keychain** (never in the frontend or the database).

Don't have a cluster? A quick local one:

```bash
docker run -p 9200:9200 -e discovery.type=single-node -e xpack.security.enabled=false \
  docker.elastic.co/elasticsearch/elasticsearch:8.14.0
```

If a real connection can't be reached, the app falls back to sample data so the UI stays usable.

---

## Where your data lives

- **SQLite database** (saved queries, query history, settings, connection metadata):
  `~/Library/Application Support/com.elasticconsole.app/elastic_console.db`
- **Keychain entries** (ES credentials): in **Keychain Access.app**, login keychain, items named
  `com.elasticconsole.app` (one per connection id). Removing a connection deletes its Keychain entry.

No secrets are ever written to SQLite or sent to the WebView.

---

## Architecture

```
WebView (React)  ──invoke──▶  Rust commands (tauri-specta)  ──reqwest──▶  Elasticsearch
     │                              │
     │                              ├─ keyring  → macOS Keychain (credentials)
     └─ tauri-plugin-sql ──▶ SQLite (saved queries / history / settings)
```

- The **query builder → DSL** translation is a pure, unit-tested module
  ([`src/lib/queryDsl.ts`](src/lib/queryDsl.ts)) — independent of React and of the transport layer.
- The UI builds the DSL, then [`src/services/source.ts`](src/services/source.ts) routes it to the
  real Rust path ([`src/services/es.ts`](src/services/es.ts)) or to offline sample data.
- Rust command modules live in [`src-tauri/src/commands`](src-tauri/src/commands) and the ES transport
  in [`src-tauri/src/es`](src-tauri/src/es).

---

## Mac App Store / notarization (ready, not required)

Distribution config is included but unused by the default local build:

- [`src-tauri/entitlements.plist`](src-tauri/entitlements.plist) — App Sandbox +
  `keychain-access-groups` + `com.apple.security.network.client`.
- [`src-tauri/Info.plist`](src-tauri/Info.plist) — `ITSAppUsesNonExemptEncryption=false`.
- [`src-tauri/tauri.appstore.conf.json`](src-tauri/tauri.appstore.conf.json) — sandboxed build overlay.
- [`src-tauri/scripts/release-mas.sh`](src-tauri/scripts/release-mas.sh) — builds the sandboxed app and
  re-signs it with an explicit `codesign --requirements` rule (working around the known Tauri MAS
  designated-requirement bug) before producing the `.pkg`. Run via `npm run release:mas` after filling
  in your signing identities.

So notarized / App Store distribution is a later config step, not a rewrite.

---

## Project layout

```
src/                      React app
  lib/                    pure logic (queryDsl, jsonModel, format, types) + tests
  stores/                 Zustand stores (tabs, connections, ui)
  services/               es (Rust bridge), source (router), sample, db
  components/             layout · topbar · builder · sidebar · results · overlays · common
  theme/ · styles/        design tokens (single source of truth)
src-tauri/                Rust shell
  src/commands/           es + keychain Tauri commands
  src/es/                 reqwest client + serde/specta models
  src/migrations/         SQLite schema
```
