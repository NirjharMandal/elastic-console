-- Elastic Console — initial schema.
-- Holds non-secret data only. Credentials live in the macOS Keychain.

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  label       TEXT NOT NULL,
  host        TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user        TEXT NOT NULL DEFAULT '',
  env         TEXT NOT NULL DEFAULT 'dev',
  index_names TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS saved_queries (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  desc    TEXT NOT NULL DEFAULT '',
  payload TEXT NOT NULL DEFAULT '',
  last    TEXT NOT NULL DEFAULT '',
  runs    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS query_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  q  TEXT NOT NULL,
  t  TEXT NOT NULL
);
