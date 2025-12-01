use crate::{error::AppResult, models::race::*, AppState};
use tauri::State;

#[tauri::command]
pub async fn get_all_races(
    limit: Option<i64>,
    offset: Option<i64>,
    status_filter: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<Race>> {
    let pool = &state.db.pool;
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let mut query = "SELECT id, race_name, race_date, distance_km, release_point, release_time, weather_condition, wind_speed, wind_direction, temperature, category, status, notes, created_at, updated_at FROM races".to_string();
    let mut conditions = Vec::new();

    if let Some(status) = status_filter {
        conditions.push(format!("status = '{}'", status));
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(" ORDER BY race_date DESC, created_at DESC LIMIT ? OFFSET ?");

    let races = sqlx::query_as::<_, Race>(&query)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

    Ok(races)
}

#[tauri::command]
pub async fn get_race_by_id(
    race_id: i64,
    state: State<'_, AppState>,
) -> AppResult<Option<Race>> {
    let pool = &state.db.pool;

    let race = sqlx::query_as::<_, Race>(
        "SELECT id, race_name, race_date, distance_km, release_point, release_time, weather_condition, wind_speed, wind_direction, temperature, category, status, notes, created_at, updated_at FROM races WHERE id = ?"
    )
    .bind(race_id)
    .fetch_optional(pool)
    .await?;

    Ok(race)
}

#[tauri::command]
pub async fn create_race(
    race_data: CreateRaceRequest,
    state: State<'_, AppState>,
) -> AppResult<Race> {
    let pool = &state.db.pool;

    let race_id = sqlx::query(
        "INSERT INTO races (race_name, race_date, distance_km, release_point, release_time, weather_condition, wind_speed, wind_direction, temperature, category, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&race_data.race_name)
    .bind(race_data.race_date)
    .bind(race_data.distance_km)
    .bind(&race_data.release_point)
    .bind(race_data.release_time)
    .bind(&race_data.weather_condition)
    .bind(race_data.wind_speed)
    .bind(&race_data.wind_direction)
    .bind(race_data.temperature)
    .bind(&race_data.category)
    .bind("scheduled") // Default status
    .bind(&race_data.notes)
    .execute(pool)
    .await?
    .last_insert_rowid();

    let created_race = sqlx::query_as::<_, Race>(
        "SELECT id, race_name, race_date, distance_km, release_point, release_time, weather_condition, wind_speed, wind_direction, temperature, category, status, notes, created_at, updated_at FROM races WHERE id = ?"
    )
    .bind(race_id)
    .fetch_one(pool)
    .await?;

    Ok(created_race)
}

#[tauri::command]
pub async fn update_race(
    race_id: i64,
    race_data: UpdateRaceRequest,
    state: State<'_, AppState>,
) -> AppResult<Race> {
    let pool = &state.db.pool;

    // Simple update approach using individual field checks
    let mut query = String::from("UPDATE races SET ");
    let mut has_updates = false;

    if race_data.race_name.is_some() {
        query.push_str("race_name = ?, ");
        has_updates = true;
    }
    if race_data.race_date.is_some() {
        query.push_str("race_date = ?, ");
        has_updates = true;
    }
    if race_data.distance_km.is_some() {
        query.push_str("distance_km = ?, ");
        has_updates = true;
    }
    if race_data.release_point.is_some() {
        query.push_str("release_point = ?, ");
        has_updates = true;
    }
    if race_data.release_time.is_some() {
        query.push_str("release_time = ?, ");
        has_updates = true;
    }
    if race_data.weather_condition.is_some() {
        query.push_str("weather_condition = ?, ");
        has_updates = true;
    }
    if race_data.wind_speed.is_some() {
        query.push_str("wind_speed = ?, ");
        has_updates = true;
    }
    if race_data.wind_direction.is_some() {
        query.push_str("wind_direction = ?, ");
        has_updates = true;
    }
    if race_data.temperature.is_some() {
        query.push_str("temperature = ?, ");
        has_updates = true;
    }
    if race_data.category.is_some() {
        query.push_str("category = ?, ");
        has_updates = true;
    }
    if race_data.status.is_some() {
        query.push_str("status = ?, ");
        has_updates = true;
    }
    if race_data.notes.is_some() {
        query.push_str("notes = ?, ");
        has_updates = true;
    }

    if !has_updates {
        // No updates to make
        return get_race_by_id(race_id, state).await.and_then(|opt| {
            opt.ok_or(crate::error::AppError::NotFound("Race not found".to_string()))
        });
    }

    // Remove trailing comma and space, add updated_at
    query.pop();
    query.pop();
    query.push_str(", updated_at = CURRENT_TIMESTAMP WHERE id = ?");

    let mut sql_query = sqlx::query(&query);

    if let Some(name) = race_data.race_name {
        sql_query = sql_query.bind(name);
    }
    if let Some(date) = race_data.race_date {
        sql_query = sql_query.bind(date);
    }
    if let Some(distance) = race_data.distance_km {
        sql_query = sql_query.bind(distance);
    }
    if let Some(point) = race_data.release_point {
        sql_query = sql_query.bind(point);
    }
    if let Some(time) = race_data.release_time {
        sql_query = sql_query.bind(time);
    }
    if let Some(weather) = race_data.weather_condition {
        sql_query = sql_query.bind(weather);
    }
    if let Some(wind_speed) = race_data.wind_speed {
        sql_query = sql_query.bind(wind_speed);
    }
    if let Some(wind_dir) = race_data.wind_direction {
        sql_query = sql_query.bind(wind_dir);
    }
    if let Some(temp) = race_data.temperature {
        sql_query = sql_query.bind(temp);
    }
    if let Some(category) = race_data.category {
        sql_query = sql_query.bind(category);
    }
    if let Some(status) = race_data.status {
        sql_query = sql_query.bind(status);
    }
    if let Some(notes) = race_data.notes {
        sql_query = sql_query.bind(notes);
    }

    sql_query = sql_query.bind(race_id);

    sql_query.execute(pool).await?;

    get_race_by_id(race_id, state).await.and_then(|opt| {
        opt.ok_or(crate::error::AppError::NotFound("Race not found".to_string()))
    })
}

#[tauri::command]
pub async fn delete_race(
    race_id: i64,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let pool = &state.db.pool;

    let result = sqlx::query("DELETE FROM races WHERE id = ?")
        .bind(race_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

#[tauri::command]
pub async fn register_pigeons_for_race(
    request: RaceRegistrationRequest,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceParticipant>> {
    let pool = &state.db.pool;
    let mut participants = Vec::new();

    for pigeon_id in request.pigeon_ids {
        let participant_id = sqlx::query(
            "INSERT OR IGNORE INTO race_participants (race_id, pigeon_id, notes) VALUES (?, ?, ?)"
        )
        .bind(request.race_id)
        .bind(pigeon_id)
        .bind(&request.notes)
        .execute(pool)
        .await?
        .last_insert_rowid();

        if participant_id > 0 {
            let participant = sqlx::query_as::<_, RaceParticipant>(
                "SELECT id, race_id, pigeon_id, basket_number, registration_time, status, notes, created_at, updated_at FROM race_participants WHERE id = ?"
            )
            .bind(participant_id)
            .fetch_one(pool)
            .await?;

            participants.push(participant);
        }
    }

    Ok(participants)
}

#[tauri::command]
pub async fn get_race_participants(
    race_id: i64,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceParticipant>> {
    let pool = &state.db.pool;

    let participants = sqlx::query_as::<_, RaceParticipant>(
        "SELECT rp.id, rp.race_id, rp.pigeon_id, rp.basket_number, rp.registration_time, rp.status, rp.notes, rp.created_at, rp.updated_at
         FROM race_participants rp
         WHERE rp.race_id = ?
         ORDER BY rp.registration_time ASC"
    )
    .bind(race_id)
    .fetch_all(pool)
    .await?;

    Ok(participants)
}

#[tauri::command]
pub async fn batch_race_results(
    batch: RaceResultBatch,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceResult>> {
    let pool = &state.db.pool;
    let mut results = Vec::new();

    for entry in batch.results {
        let result_id = sqlx::query(
            "INSERT OR REPLACE INTO race_results (race_id, pigeon_id, arrival_time, arrival_speed, flight_duration_seconds, distance_flown_km, rank_position, points, prize_won, disqualification_reason, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(batch.race_id)
        .bind(entry.pigeon_id)
        .bind(entry.arrival_time)
        .bind(None::<f64>) // Calculate automatically
        .bind(None::<i64>)  // Calculate automatically
        .bind(None::<f64>)  // Calculate automatically
        .bind(entry.rank_position)
        .bind(entry.points)
        .bind(entry.prize_won)
        .bind(&entry.disqualification_reason)
        .bind(&entry.status)
        .bind(&entry.notes)
        .execute(pool)
        .await?
        .last_insert_rowid();

        let result = sqlx::query_as::<_, RaceResult>(
            "SELECT id, race_id, pigeon_id, arrival_time, arrival_speed, flight_duration_seconds, distance_flown_km, rank_position, points, prize_won, disqualification_reason, status, notes, created_at, updated_at FROM race_results WHERE id = ?"
        )
        .bind(result_id)
        .fetch_one(pool)
        .await?;

        results.push(result);
    }

    Ok(results)
}

#[tauri::command]
pub async fn get_race_results(
    race_id: i64,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceResult>> {
    let pool = &state.db.pool;

    let results = sqlx::query_as::<_, RaceResult>(
        "SELECT id, race_id, pigeon_id, arrival_time, arrival_speed, flight_duration_seconds, distance_flown_km, rank_position, points, prize_won, disqualification_reason, status, notes, created_at, updated_at
         FROM race_results
         WHERE race_id = ?
         ORDER BY rank_position ASC, arrival_time ASC"
    )
    .bind(race_id)
    .fetch_all(pool)
    .await?;

    Ok(results)
}

#[tauri::command]
pub async fn get_race_statistics(
    race_id: i64,
    state: State<'_, AppState>,
) -> AppResult<Option<RaceStatistics>> {
    let pool = &state.db.pool;

    let stats = sqlx::query_as::<_, RaceStatistics>(
        "SELECT race_id, race_name, race_date, distance_km, category, race_status, total_participants, total_finishers, finished_count, disqualified_count, lost_count, completion_rate_percent, average_speed_mps, average_flight_duration_seconds, first_arrival_time, last_arrival_time, time_span_seconds
         FROM race_statistics
         WHERE race_id = ?"
    )
    .bind(race_id)
    .fetch_optional(pool)
    .await?;

    Ok(stats)
}

#[tauri::command]
pub async fn get_all_race_statistics(
    limit: Option<i64>,
    offset: Option<i64>,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceStatistics>> {
    let pool = &state.db.pool;
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let stats = sqlx::query_as::<_, RaceStatistics>(
        "SELECT race_id, race_name, race_date, distance_km, category, race_status, total_participants, total_finishers, finished_count, disqualified_count, lost_count, completion_rate_percent, average_speed_mps, average_flight_duration_seconds, first_arrival_time, last_arrival_time, time_span_seconds
         FROM race_statistics
         ORDER BY race_date DESC
         LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(stats)
}

// Additional utility functions for race management

#[tauri::command]
pub async fn get_pigeon_race_history(
    pigeon_id: i64,
    state: State<'_, AppState>,
) -> AppResult<Vec<RaceResult>> {
    let pool = &state.db.pool;

    let results = sqlx::query_as::<_, RaceResult>(
        "SELECT rr.id, rr.race_id, rr.pigeon_id, rr.arrival_time, rr.arrival_speed, rr.flight_duration_seconds, rr.distance_flown_km, rr.rank_position, rr.points, rr.prize_won, rr.disqualification_reason, rr.status, rr.notes, rr.created_at, rr.updated_at
         FROM race_results rr
         JOIN races r ON rr.race_id = r.id
         WHERE rr.pigeon_id = ?
         ORDER BY r.race_date DESC, rr.arrival_time ASC"
    )
    .bind(pigeon_id)
    .fetch_all(pool)
    .await?;

    Ok(results)
}

#[tauri::command]
pub async fn search_races(
    search_term: String,
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> AppResult<Vec<Race>> {
    let pool = &state.db.pool;
    let limit = limit.unwrap_or(50);

    let races = sqlx::query_as::<_, Race>(
        "SELECT id, race_name, race_date, distance_km, release_point, release_time, weather_condition, wind_speed, wind_direction, temperature, category, status, notes, created_at, updated_at
         FROM races
         WHERE race_name LIKE ? OR release_point LIKE ? OR notes LIKE ?
         ORDER BY race_date DESC
         LIMIT ?"
    )
    .bind(format!("%{}%", search_term))
    .bind(format!("%{}%", search_term))
    .bind(format!("%{}%", search_term))
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(races)
}