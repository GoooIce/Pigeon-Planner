use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Race {
    pub id: Option<i64>,
    pub race_name: String,
    pub race_date: NaiveDate,
    pub distance_km: f64,
    pub release_point: Option<String>,
    pub release_time: Option<DateTime<Utc>>,
    pub weather_condition: Option<String>,
    pub wind_speed: Option<f64>,
    pub wind_direction: Option<String>,
    pub temperature: Option<f64>,
    pub category: String, // Using String instead of enum for simpler DB mapping
    pub status: String,   // Using String instead of enum for simpler DB mapping
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RaceParticipant {
    pub id: Option<i64>,
    pub race_id: i64,
    pub pigeon_id: i64,
    pub basket_number: Option<String>,
    pub registration_time: Option<DateTime<Utc>>,
    pub status: String, // Using String instead of enum
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RaceResult {
    pub id: Option<i64>,
    pub race_id: i64,
    pub pigeon_id: i64,
    pub arrival_time: DateTime<Utc>,
    pub arrival_speed: Option<f64>,
    pub flight_duration_seconds: Option<i64>,
    pub distance_flown_km: Option<f64>,
    pub rank_position: Option<i64>,
    pub points: Option<f64>,
    pub prize_won: Option<f64>,
    pub disqualification_reason: Option<String>,
    pub status: String, // Using String instead of enum
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RaceStatistics {
    pub race_id: i64,
    pub race_name: String,
    pub race_date: NaiveDate,
    pub distance_km: f64,
    pub category: String,
    pub race_status: String,
    pub total_participants: i64,
    pub total_finishers: i64,
    pub finished_count: i64,
    pub disqualified_count: i64,
    pub lost_count: i64,
    pub completion_rate_percent: f64,
    pub average_speed_mps: Option<f64>,
    pub average_flight_duration_seconds: Option<i64>,
    pub first_arrival_time: Option<DateTime<Utc>>,
    pub last_arrival_time: Option<DateTime<Utc>>,
    pub time_span_seconds: Option<f64>,
}

// Request DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct RaceRegistrationRequest {
    pub race_id: i64,
    pub pigeon_ids: Vec<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RaceResultBatch {
    pub race_id: i64,
    pub results: Vec<RaceResultEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RaceResultEntry {
    pub pigeon_id: i64,
    pub arrival_time: DateTime<Utc>,
    pub rank_position: Option<i64>,
    pub points: Option<f64>,
    pub prize_won: Option<f64>,
    pub disqualification_reason: Option<String>,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRaceRequest {
    pub race_name: String,
    pub race_date: NaiveDate,
    pub distance_km: f64,
    pub release_point: Option<String>,
    pub release_time: Option<DateTime<Utc>>,
    pub weather_condition: Option<String>,
    pub wind_speed: Option<f64>,
    pub wind_direction: Option<String>,
    pub temperature: Option<f64>,
    pub category: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRaceRequest {
    pub race_name: Option<String>,
    pub race_date: Option<NaiveDate>,
    pub distance_km: Option<f64>,
    pub release_point: Option<String>,
    pub release_time: Option<DateTime<Utc>>,
    pub weather_condition: Option<String>,
    pub wind_speed: Option<f64>,
    pub wind_direction: Option<String>,
    pub temperature: Option<f64>,
    pub category: Option<String>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RaceSearchParams {
    pub query: Option<String>,
    pub category: Option<String>,
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}