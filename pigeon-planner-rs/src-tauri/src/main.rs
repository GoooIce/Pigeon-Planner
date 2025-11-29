// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::SqlitePool;

mod commands;
mod models;
mod services;
mod database;
mod utils;
mod error;

use database::Database;

pub struct AppState {
    pub db: Database,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    // Initialize database
    let db_pool = match database::init_database().await {
        Ok(pool) => {
            tracing::info!("Database initialized successfully");
            pool
        }
        Err(e) => {
            tracing::error!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };

    let app_state = AppState {
        db: Database::new(db_pool)
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Pigeon commands
            commands::pigeon::get_all_pigeons,
            commands::pigeon::get_pigeon_by_id,
            commands::pigeon::create_pigeon,
            commands::pigeon::update_pigeon,
            commands::pigeon::delete_pigeon,
            commands::pigeon::search_pigeons,

            // Pedigree commands
            commands::pedigree::get_pigeon_pedigree,
            commands::pedigree::calculate_relationship,
            commands::pedigree::search_bloodline,
            commands::pedigree::update_parent_relationship,
            commands::pedigree::get_pedigree_stats,

            // Breeding commands
            commands::breeding::create_breeding_pair,
            commands::breeding::get_breeding_pairs,
            commands::breeding::get_breeding_pair_by_id,
            commands::breeding::update_breeding_pair,
            commands::breeding::delete_breeding_pair,
            commands::breeding::create_breeding_record,
            commands::breeding::get_breeding_records,
            commands::breeding::update_breeding_record,
            commands::breeding::get_nest_boxes,
            commands::breeding::assign_nest_box,
            commands::breeding::get_breeding_statistics,
            commands::breeding::search_breeding_pairs,

            // Race management commands
            commands::race::get_all_races,
            commands::race::get_race_by_id,
            commands::race::create_race,
            commands::race::update_race,
            commands::race::delete_race,
            commands::race::register_pigeons_for_race,
            commands::race::get_race_participants,
            commands::race::batch_race_results,
            commands::race::get_race_results,
            commands::race::get_race_statistics,
            commands::race::get_all_race_statistics,
            commands::race::get_pigeon_race_history,
            commands::race::search_races,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}