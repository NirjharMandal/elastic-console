//! Serde + specta types for the Elasticsearch transport layer.
//! Field renames keep the TypeScript shape identical to src/lib/types.ts.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

/// Connection metadata passed from the frontend (never the secret).
#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ConnInput {
    pub id: String,
    pub host: String,
    pub auth: String,
    pub user: String,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct Hit {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_index")]
    pub index: String,
    #[serde(rename = "_score")]
    pub score: Option<f64>,
    #[serde(rename = "_source")]
    pub source: Value,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct Bucket {
    pub key: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CausedBy {
    #[serde(rename = "type")]
    pub kind: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EsError {
    #[serde(rename = "type")]
    pub kind: String,
    pub reason: String,
    pub status: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub index: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shard: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub caused_by: Option<CausedBy>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub total: i64,
    pub took: i64,
    pub hits: Vec<Hit>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buckets: Option<Vec<Bucket>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_by_field: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub doc_count: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<EsError>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct IndexInfo {
    pub name: String,
    pub docs: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ClusterInfo {
    pub health: String,
    pub version: String,
    pub nodes: i64,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct Field {
    pub f: String,
    pub t: String,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TestResult {
    pub ok: bool,
    pub took_ms: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}
