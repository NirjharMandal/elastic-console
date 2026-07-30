//! Smoke test for the real Elasticsearch transport against a local cluster.
//! Run with:  cargo run --example es_smoke
//! Exercises the SAME code the Tauri commands use (es::client), no GUI involved.

use elastic_console_lib::es::{client, model::ConnInput};

#[tokio::main]
async fn main() {
    let conn = ConnInput {
        id: "smoke".to_string(),
        host: "http://localhost:9200".to_string(),
        auth: "none".to_string(),
        user: String::new(),
    };

    println!("== cluster_health ==");
    match client::cluster_health(&conn).await {
        Ok(h) => println!("  status={} version={} nodes={}", h.health, h.version, h.nodes),
        Err(e) => println!("  ERROR: {e}"),
    }

    println!("== list_indices ==");
    let mut first_index = String::from("products");
    match client::list_indices(&conn).await {
        Ok(idx) => {
            println!("  {} indices", idx.len());
            for i in idx.iter().take(8) {
                println!("   - {} ({} docs)", i.name, i.docs);
            }
            if let Some(i) = idx.iter().find(|i| i.docs > 0) {
                first_index = i.name.clone();
            }
        }
        Err(e) => println!("  ERROR: {e}"),
    }

    println!("== field_caps({first_index}) ==");
    match client::field_caps(&conn, &first_index).await {
        Ok(f) => {
            println!("  {} fields", f.len());
            for x in f.iter().take(6) {
                println!("   - {}: {}", x.f, x.t);
            }
        }
        Err(e) => println!("  ERROR: {e}"),
    }

    println!("== search({first_index}) ==");
    let dsl = serde_json::json!({ "query": { "match_all": {} }, "size": 2 });
    match client::search(&conn, &first_index, dsl).await {
        Ok(r) => {
            println!("  total={} took={}ms hits_returned={}", r.total, r.took, r.hits.len());
            if let Some(h) = r.hits.first() {
                println!("  first _id={} _index={}", h.id, h.index);
            }
            if let Some(e) = r.error {
                println!("  ES error: {} - {}", e.kind, e.reason);
            }
        }
        Err(e) => println!("  ERROR: {e}"),
    }

    println!("== search(missing index) -> expect a readable ES error ==");
    let dsl2 = serde_json::json!({ "query": { "match_all": {} } });
    match client::search(&conn, "definitely_missing_idx_xyz", dsl2).await {
        Ok(r) => match r.error {
            Some(e) => println!("  got ES error: {} (HTTP {})", e.kind, e.status),
            None => println!("  no error (total={})", r.total),
        },
        Err(e) => println!("  transport ERROR: {e}"),
    }
}
