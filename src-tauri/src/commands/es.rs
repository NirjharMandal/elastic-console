//! Thin Tauri command wrappers over the ES transport. All Elasticsearch I/O
//! happens here on the Rust side; the WebView only ever invokes these.

use serde_json::Value;

use crate::es::client;
use crate::es::model::*;

#[tauri::command]
#[specta::specta]
pub async fn es_search(conn: ConnInput, index: String, dsl: Value) -> Result<SearchResult, String> {
    client::search(&conn, &index, dsl).await
}

#[tauri::command]
#[specta::specta]
pub async fn es_get_doc(conn: ConnInput, index: String, id: String) -> Result<Option<Hit>, String> {
    client::get_doc(&conn, &index, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn es_list_indices(conn: ConnInput) -> Result<Vec<IndexInfo>, String> {
    client::list_indices(&conn).await
}

#[tauri::command]
#[specta::specta]
pub async fn es_cluster_health(conn: ConnInput) -> Result<ClusterInfo, String> {
    client::cluster_health(&conn).await
}

#[tauri::command]
#[specta::specta]
pub async fn es_field_caps(conn: ConnInput, index: String) -> Result<Vec<Field>, String> {
    client::field_caps(&conn, &index).await
}

#[tauri::command]
#[specta::specta]
pub async fn es_test_connection(conn: ConnInput) -> Result<TestResult, String> {
    client::test_connection(&conn).await
}
