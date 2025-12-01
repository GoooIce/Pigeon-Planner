use sqlx::{SqlitePool, migrate::MigrateDatabase, Sqlite};
use crate::error::AppResult;

pub mod connection;
pub use connection::Database;

pub async fn init_database() -> AppResult<SqlitePool> {
    let database_url = "sqlite:pigeon_planner.db";

    // Create database if it doesn't exist
    if !Sqlite::database_exists(database_url).await.unwrap_or(false) {
        Sqlite::create_database(database_url).await?;
        tracing::info!("Created new database: {}", database_url);
    }

    // Connect to database
    let pool = SqlitePool::connect(database_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("Database migrations completed successfully");

    Ok(pool)
}