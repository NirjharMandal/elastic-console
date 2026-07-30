//! Elasticsearch transport: builds reqwest requests (auth resolved from the
//! macOS Keychain on this side) and normalizes responses/errors into model types.

use std::time::{Duration, Instant};

use reqwest::{Client, RequestBuilder};
use serde_json::{json, Value};

use super::model::*;
use crate::commands::keychain;

fn base(conn: &ConnInput) -> String {
    conn.host.trim_end_matches('/').to_string()
}

fn client() -> Client {
    Client::builder()
        // Personal/local tool: tolerate self-signed certs on localhost clusters.
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(20))
        .build()
        .unwrap_or_else(|_| Client::new())
}

/// Apply the connection's auth, pulling the secret from the Keychain by id.
fn auth(rb: RequestBuilder, conn: &ConnInput) -> RequestBuilder {
    let secret = keychain::get(&conn.id);
    match conn.auth.as_str() {
        "basic" => rb.basic_auth(conn.user.clone(), secret),
        "apikey" => match secret {
            Some(k) if !k.is_empty() => rb.header("Authorization", format!("ApiKey {}", k)),
            _ => rb,
        },
        _ => rb,
    }
}

async fn get_json(conn: &ConnInput, path: &str) -> Result<(u16, Value), String> {
    let url = format!("{}/{}", base(conn), path.trim_start_matches('/'));
    let resp = auth(client().get(&url), conn)
        .send()
        .await
        .map_err(|e| format!("could not reach {}: {}", base(conn), e))?;
    let status = resp.status().as_u16();
    let body = resp.json::<Value>().await.unwrap_or(Value::Null);
    Ok((status, body))
}

fn parse_total(total: &Value) -> i64 {
    if total.is_i64() || total.is_u64() {
        total.as_i64().unwrap_or(0)
    } else {
        total.get("value").and_then(|v| v.as_i64()).unwrap_or(0)
    }
}

fn parse_hit(h: &Value) -> Hit {
    Hit {
        id: h.get("_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        index: h.get("_index").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        score: h.get("_score").and_then(|v| v.as_f64()),
        source: h.get("_source").cloned().unwrap_or(Value::Null),
    }
}

fn parse_buckets(aggs: &Value) -> Option<Vec<Bucket>> {
    let obj = aggs.as_object()?;
    for (_k, agg) in obj {
        if let Some(buckets) = agg.get("buckets").and_then(|b| b.as_array()) {
            return Some(
                buckets
                    .iter()
                    .map(|b| {
                        let key = b
                            .get("key_as_string")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string())
                            .or_else(|| b.get("key").and_then(|v| v.as_str()).map(|s| s.to_string()))
                            .or_else(|| b.get("key").map(|v| v.to_string()))
                            .unwrap_or_default();
                        let count = b.get("doc_count").and_then(|v| v.as_i64()).unwrap_or(0);
                        Bucket { key, count }
                    })
                    .collect(),
            );
        }
    }
    None
}

fn parse_es_error(err: &Value, status: i64) -> EsError {
    let root = err.get("root_cause").and_then(|r| r.as_array()).and_then(|a| a.first());
    let pick = |k: &str| {
        err.get(k)
            .and_then(|v| v.as_str())
            .or_else(|| root.and_then(|r| r.get(k)).and_then(|v| v.as_str()))
            .map(|s| s.to_string())
    };
    let caused_by = err.get("caused_by").map(|c| CausedBy {
        kind: c.get("type").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        reason: c.get("reason").and_then(|v| v.as_str()).unwrap_or("").to_string(),
    });
    EsError {
        kind: err.get("type").and_then(|v| v.as_str()).unwrap_or("error").to_string(),
        reason: err.get("reason").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        status,
        index: pick("index"),
        shard: err
            .get("shard")
            .and_then(|v| v.as_i64())
            .or_else(|| root.and_then(|r| r.get("shard")).and_then(|v| v.as_i64())),
        node: pick("node"),
        caused_by,
    }
}

pub async fn search(conn: &ConnInput, index: &str, dsl: Value) -> Result<SearchResult, String> {
    let url = format!("{}/{}/_search", base(conn), index);
    let resp = auth(client().post(&url).json(&dsl), conn)
        .send()
        .await
        .map_err(|e| format!("could not reach {}: {}", base(conn), e))?;
    let status = resp.status().as_u16() as i64;
    let body = resp.json::<Value>().await.map_err(|e| e.to_string())?;

    if let Some(err) = body.get("error") {
        return Ok(SearchResult {
            total: 0,
            took: 0,
            hits: vec![],
            buckets: None,
            group_by_field: None,
            doc_count: None,
            error: Some(parse_es_error(err, body.get("status").and_then(|v| v.as_i64()).unwrap_or(status))),
        });
    }

    let hits_node = &body["hits"];
    let total = parse_total(&hits_node["total"]);
    let hits = hits_node["hits"]
        .as_array()
        .map(|a| a.iter().map(parse_hit).collect())
        .unwrap_or_default();
    let buckets = body.get("aggregations").and_then(parse_buckets);

    Ok(SearchResult {
        total,
        took: body["took"].as_i64().unwrap_or(0),
        hits,
        buckets,
        group_by_field: None,
        doc_count: None,
        error: None,
    })
}

pub async fn get_doc(conn: &ConnInput, index: &str, id: &str) -> Result<Option<Hit>, String> {
    let (status, body) = get_json(conn, &format!("{}/_doc/{}", index, id)).await?;
    if status == 404 || body.get("found").and_then(|v| v.as_bool()) == Some(false) {
        return Ok(None);
    }
    if body.get("error").is_some() {
        return Ok(None);
    }
    Ok(Some(Hit {
        id: body.get("_id").and_then(|v| v.as_str()).unwrap_or(id).to_string(),
        index: body.get("_index").and_then(|v| v.as_str()).unwrap_or(index).to_string(),
        score: None,
        source: body.get("_source").cloned().unwrap_or(Value::Null),
    }))
}

pub async fn list_indices(conn: &ConnInput) -> Result<Vec<IndexInfo>, String> {
    let (_s, body) = get_json(conn, "_cat/indices?format=json&h=index,docs.count,health&s=index").await?;
    let arr = body.as_array().cloned().unwrap_or_default();
    Ok(arr
        .iter()
        .filter_map(|v| {
            let name = v.get("index").and_then(|x| x.as_str())?.to_string();
            let docs = v
                .get("docs.count")
                .and_then(|x| x.as_str())
                .and_then(|s| s.parse::<i64>().ok())
                .unwrap_or(0);
            let health = v.get("health").and_then(|x| x.as_str()).map(|s| s.to_string());
            Some(IndexInfo { name, docs, health })
        })
        .collect())
}

pub async fn cluster_health(conn: &ConnInput) -> Result<ClusterInfo, String> {
    let (_s, health) = get_json(conn, "_cluster/health").await?;
    let (_s2, root) = get_json(conn, "").await.unwrap_or((0, Value::Null));
    Ok(ClusterInfo {
        health: health.get("status").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
        version: root
            .get("version")
            .and_then(|v| v.get("number"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        nodes: health.get("number_of_nodes").and_then(|v| v.as_i64()).unwrap_or(0),
    })
}

fn map_field_type(es: &str) -> &'static str {
    match es {
        "keyword" | "constant_keyword" | "wildcard" => "keyword",
        "text" | "match_only_text" | "search_as_you_type" => "text",
        "date" | "date_nanos" => "date",
        "boolean" => "boolean",
        "nested" => "nested",
        "long" | "integer" | "short" | "byte" | "double" | "float" | "half_float"
        | "scaled_float" | "unsigned_long" => "long",
        _ => "keyword",
    }
}

pub async fn field_caps(conn: &ConnInput, index: &str) -> Result<Vec<Field>, String> {
    let (_s, body) = get_json(conn, &format!("{}/_field_caps?fields=*", index)).await?;
    let fields = body.get("fields").and_then(|f| f.as_object());
    let mut out = vec![];
    if let Some(fields) = fields {
        for (name, caps) in fields {
            if name.starts_with('_') {
                continue;
            }
            if let Some(es_type) = caps.as_object().and_then(|o| o.keys().next()) {
                out.push(Field { f: name.clone(), t: map_field_type(es_type).to_string() });
            }
        }
    }
    out.sort_by(|a, b| a.f.cmp(&b.f));
    Ok(out)
}

pub async fn test_connection(conn: &ConnInput) -> Result<TestResult, String> {
    let start = Instant::now();
    let url = format!("{}/", base(conn));
    let resp = auth(client().get(&url), conn).send().await;
    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return Ok(TestResult {
                ok: false,
                took_ms: 0,
                version: None,
                nodes: None,
                health: None,
                message: Some(format!("could not reach {}: {}", base(conn), e)),
            })
        }
    };
    let status = resp.status();
    let body = resp.json::<Value>().await.unwrap_or(Value::Null);
    if !status.is_success() {
        let msg = body
            .get("error")
            .and_then(|e| e.get("reason"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
        return Ok(TestResult { ok: false, took_ms: start.elapsed().as_millis() as i64, version: None, nodes: None, health: None, message: Some(msg) });
    }
    let version = body
        .get("version")
        .and_then(|v| v.get("number"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let health = cluster_health(conn).await.ok();
    Ok(TestResult {
        ok: true,
        took_ms: start.elapsed().as_millis() as i64,
        version,
        nodes: health.as_ref().map(|h| h.nodes),
        health: health.map(|h| h.health),
        message: None,
    })
}

// Allow building a richer body later (e.g. count) without breaking callers.
#[allow(dead_code)]
fn count_body() -> Value {
    json!({ "size": 0 })
}
