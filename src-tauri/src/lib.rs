//! Tauri application entry: registers the specta-typed command bridge, the
//! SQLite plugin (with migrations), and exports TypeScript bindings in debug.

mod commands;
pub mod es;

use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_specta::{collect_commands, Builder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::es::es_search,
        commands::es::es_get_doc,
        commands::es::es_list_indices,
        commands::es::es_cluster_health,
        commands::es::es_field_caps,
        commands::es::es_test_connection,
        commands::keychain::set_credential,
        commands::keychain::delete_credential,
    ]);

    // Emit the type-safe Rust↔TS bridge during development. Map Rust i64/u64
    // (counts, took, status, …) to TS `number` instead of failing on BigInt.
    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number)
                .header("// @ts-nocheck\n/* eslint-disable */\n"),
            "../src/bindings.ts",
        )
        .expect("failed to export typescript bindings");

    let migrations = vec![Migration {
        version: 1,
        description: "init",
        sql: include_str!("migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:elastic_console.db", migrations)
                .build(),
        )
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
