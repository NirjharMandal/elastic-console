#!/usr/bin/env bash
#
# Mac App Store packaging for Elastic Console.
#
# Works around the known Tauri MAS "designated requirement" signing bug: the
# default signature Tauri applies carries a designated requirement that
# productbuild / App Store Connect rejects. We re-sign the bundled .app with an
# explicit `--requirements` rule before building the .pkg.
#
# This is OPTIONAL — the normal local build (`npm run tauri build`) produces an
# unsigned, double-clickable .app/.dmg and does not need any of this. Use this
# only when you have Apple Distribution certs and want to submit to the MAS.
#
# Prerequisites:
#   - "3rd Party Mac Developer Application: NAME (TEAMID)" cert in the keychain
#   - "3rd Party Mac Developer Installer:  NAME (TEAMID)" cert in the keychain
#   - A provisioning profile for com.elasticconsole.app
#   - Identities filled into src-tauri/tauri.appstore.conf.json + the vars below
#
set -euo pipefail

APP_NAME="Elastic Console"
IDENTIFIER="com.elasticconsole.app"
APP_CERT="${APP_CERT:-3rd Party Mac Developer Application: YOUR NAME (TEAMID)}"
INSTALLER_CERT="${INSTALLER_CERT:-3rd Party Mac Developer Installer: YOUR NAME (TEAMID)}"
ENTITLEMENTS="src-tauri/entitlements.plist"
TARGET="${TARGET:-universal-apple-darwin}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Building sandboxed app bundle (App Store config overlay)…"
npm run tauri build -- \
  --target "$TARGET" \
  --config src-tauri/tauri.appstore.conf.json \
  --bundles app

APP_PATH="src-tauri/target/${TARGET}/release/bundle/macos/${APP_NAME}.app"
PKG_PATH="src-tauri/target/${TARGET}/release/bundle/macos/${APP_NAME}.pkg"

echo "==> Re-signing .app with an explicit designated requirement (Tauri MAS fix)…"
codesign --force --timestamp --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --requirements "=designated => identifier \"$IDENTIFIER\" and anchor apple generic" \
  --sign "$APP_CERT" \
  "$APP_PATH"

echo "==> Verifying signature…"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo "==> Building installer .pkg for the Mac App Store…"
productbuild --sign "$INSTALLER_CERT" --component "$APP_PATH" /Applications "$PKG_PATH"

echo "==> Done: $PKG_PATH"
echo "    Upload with: xcrun altool --upload-app -f \"$PKG_PATH\" -t macos -u <apple-id> -p <app-specific-password>"
