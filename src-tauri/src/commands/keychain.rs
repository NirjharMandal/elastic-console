//! macOS Keychain credential storage (keyring crate). Secrets live here only —
//! never in the WebView, the frontend, or SQLite.

use keyring::Entry;

const SERVICE: &str = "com.elasticconsole.app";

/// Internal: read a connection's secret (used by the ES transport).
pub fn get(conn_id: &str) -> Option<String> {
    Entry::new(SERVICE, conn_id).ok()?.get_password().ok()
}

#[tauri::command]
#[specta::specta]
pub fn set_credential(conn_id: String, secret: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE, &conn_id).map_err(|e| e.to_string())?;
    entry.set_password(&secret).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn delete_credential(conn_id: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE, &conn_id).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
