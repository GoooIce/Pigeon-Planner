use crate::models::health::*;
use crate::database::Database;
use anyhow::Result;
use chrono::{NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::State;
use sqlx::Row;

// Simplified health command implementation using runtime queries

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimpleHealthCheck {
    pub id: Option<i64>,
    pub pigeon_id: i64,
    pub check_date: String,
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub condition: String,
    pub notes: Option<String>,
    pub examiner: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimpleHealthCheckInput {
    pub pigeon_id: i64,
    pub check_date: String,
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub condition: String,
    pub notes: Option<String>,
    pub examiner: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimpleHealthSummary {
    pub total_pigeons: i64,
    pub healthy_pigeons: i64,
    pub total_vaccinations: i64,
    pub recent_health_checks: i64,
}

#[tauri::command]
pub async fn create_simple_health_check(
    check_input: SimpleHealthCheckInput,
    db: State<'_, Database>,
) -> Result<SimpleHealthCheck, String> {
    let pool = &db.pool;

    let result = sqlx::query(
        r#"
        INSERT INTO health_checks (
            pigeon_id, check_date, weight, temperature, condition,
            notes, examiner, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
        RETURNING id, created_at
        "#
    )
    .bind(check_input.pigeon_id)
    .bind(&check_input.check_date)
    .bind(check_input.weight)
    .bind(check_input.temperature)
    .bind(&check_input.condition)
    .bind(&check_input.notes)
    .bind(&check_input.examiner)
    .bind(Utc::now().format("%Y-%m-%d %H:%M:%S").to_string())
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to create health check: {}", e))?;

    Ok(SimpleHealthCheck {
        id: Some(result.get("id")),
        pigeon_id: check_input.pigeon_id,
        check_date: check_input.check_date,
        weight: check_input.weight,
        temperature: check_input.temperature,
        condition: check_input.condition,
        notes: check_input.notes,
        examiner: check_input.examiner,
        created_at: result.get("created_at"),
    })
}

#[tauri::command]
pub async fn get_simple_health_checks(
    pigeon_id: i64,
    db: State<'_, Database>,
) -> Result<Vec<SimpleHealthCheck>, String> {
    let pool = &db.pool;

    let rows = sqlx::query(
        r#"
        SELECT id, pigeon_id, check_date, weight, temperature, condition,
               notes, examiner, created_at
        FROM health_checks
        WHERE pigeon_id = ?1
        ORDER BY check_date DESC, created_at DESC
        LIMIT 100
        "#
    )
    .bind(pigeon_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch health checks: {}", e))?;

    let checks: Vec<SimpleHealthCheck> = rows.into_iter().map(|row| {
        SimpleHealthCheck {
            id: row.get("id"),
            pigeon_id: row.get("pigeon_id"),
            check_date: row.get("check_date"),
            weight: row.get("weight"),
            temperature: row.get("temperature"),
            condition: row.get("condition"),
            notes: row.get("notes"),
            examiner: row.get("examiner"),
            created_at: row.get("created_at"),
        }
    }).collect();

    Ok(checks)
}

#[tauri::command]
pub async fn get_simple_health_summary(
    db: State<'_, Database>,
) -> Result<SimpleHealthSummary, String> {
    let pool = &db.pool;

    let result = sqlx::query(
        r#"
        SELECT
            COUNT(DISTINCT p.id) as total_pigeons,
            COUNT(DISTINCT CASE WHEN hc.id IS NOT NULL THEN p.id END) as pigeons_with_checks,
            COUNT(DISTINCT v.id) as total_vaccinations,
            COUNT(DISTINCT CASE WHEN hc.check_date >= date('now', '-7 days') THEN p.id END) as recent_health_checks
        FROM pigeons p
        LEFT JOIN health_checks hc ON p.id = hc.pigeon_id
        LEFT JOIN vaccinations v ON p.id = v.pigeon_id
        "#
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch health summary: {}", e))?;

    Ok(SimpleHealthSummary {
        total_pigeons: result.get("total_pigeons"),
        healthy_pigeons: result.get("pigeons_with_checks"),
        total_vaccinations: result.get("total_vaccinations"),
        recent_health_checks: result.get("recent_health_checks"),
    })
}

#[tauri::command]
pub async fn delete_simple_health_check(
    id: i64,
    db: State<'_, Database>,
) -> Result<(), String> {
    let pool = &db.pool;

    let result = sqlx::query(
        "DELETE FROM health_checks WHERE id = ?1"
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete health check: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("Health check not found".to_string());
    }

    Ok(())
}