use crate::{error::AppResult, models::pigeon::{Pigeon, CreatePigeonRequest, UpdatePigeonRequest, PigeonSearchParams}, AppState};
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn get_all_pigeons(
    limit: Option<i32>,
    offset: Option<i32>,
    state: State<'_, AppState>,
) -> AppResult<Vec<Pigeon>> {
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let rows = sqlx::query(
        r#"
        SELECT
            id, ring_number, year, name, color, sex, strain, loft, status,
            image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
            sire_id, dam_id, extra_fields, created_at, updated_at
        FROM pigeons
        ORDER BY created_at DESC
        LIMIT ?1 OFFSET ?2
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db.pool)
    .await?;

    let pigeons: Vec<Pigeon> = rows
        .into_iter()
        .map(|row| Pigeon {
            id: Some(row.get("id")),
            ring_number: row.get("ring_number"),
            year: row.get("year"),
            name: row.get("name"),
            color: row.get("color"),
            sex: row.get("sex"),
            strain: row.get("strain"),
            loft: row.get("loft"),
            status: row.get("status"),
            image_path: row.get("image_path"),
            sire_ring_number: row.get("sire_ring_number"),
            sire_year: row.get("sire_year"),
            dam_ring_number: row.get("dam_ring_number"),
            dam_year: row.get("dam_year"),
            sire_id: row.get("sire_id"),
            dam_id: row.get("dam_id"),
            extra_fields: row.get("extra_fields"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(pigeons)
}

#[tauri::command]
pub async fn get_pigeon_by_id(
    id: i64,
    state: State<'_, AppState>,
) -> AppResult<Pigeon> {
    let row = sqlx::query(
        r#"
        SELECT
            id, ring_number, year, name, color, sex, strain, loft, status,
            image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
            sire_id, dam_id, extra_fields, created_at, updated_at
        FROM pigeons
        WHERE id = ?1
        "#
    )
    .bind(id)
    .fetch_one(&state.db.pool)
    .await?;

    let pigeon = Pigeon {
        id: Some(row.get("id")),
        ring_number: row.get("ring_number"),
        year: row.get("year"),
        name: row.get("name"),
        color: row.get("color"),
        sex: row.get("sex"),
        strain: row.get("strain"),
        loft: row.get("loft"),
        status: row.get("status"),
        image_path: row.get("image_path"),
        sire_ring_number: row.get("sire_ring_number"),
        sire_year: row.get("sire_year"),
        dam_ring_number: row.get("dam_ring_number"),
        dam_year: row.get("dam_year"),
        sire_id: row.get("sire_id"),
        dam_id: row.get("dam_id"),
        extra_fields: row.get("extra_fields"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    };

    Ok(pigeon)
}

#[tauri::command]
pub async fn create_pigeon(
    pigeon_data: CreatePigeonRequest,
    state: State<'_, AppState>,
) -> AppResult<Pigeon> {
    let row = sqlx::query(
        r#"
        INSERT INTO pigeons (
            ring_number, year, name, color, sex, strain, loft, status,
            image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
            sire_id, dam_id, extra_fields, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING
            id, ring_number, year, name, color, sex, strain, loft, status,
            image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
            sire_id, dam_id, extra_fields, created_at, updated_at
        "#
    )
    .bind(&pigeon_data.ring_number)
    .bind(pigeon_data.year)
    .bind(&pigeon_data.name)
    .bind(&pigeon_data.color)
    .bind(pigeon_data.sex)
    .bind(&pigeon_data.strain)
    .bind(&pigeon_data.loft)
    .bind(1i32) // Default to active status
    .bind(&pigeon_data.image_path)
    .bind(&pigeon_data.sire_ring_number)
    .bind(pigeon_data.sire_year)
    .bind(&pigeon_data.dam_ring_number)
    .bind(pigeon_data.dam_year)
    .bind(pigeon_data.sire_id)
    .bind(pigeon_data.dam_id)
    .bind(&pigeon_data.extra_fields)
    .bind(chrono::Utc::now())
    .bind(chrono::Utc::now())
    .fetch_one(&state.db.pool)
    .await?;

    let new_pigeon = Pigeon {
        id: Some(row.get("id")),
        ring_number: row.get("ring_number"),
        year: row.get("year"),
        name: row.get("name"),
        color: row.get("color"),
        sex: row.get("sex"),
        strain: row.get("strain"),
        loft: row.get("loft"),
        status: row.get("status"),
        image_path: row.get("image_path"),
        sire_ring_number: row.get("sire_ring_number"),
        sire_year: row.get("sire_year"),
        dam_ring_number: row.get("dam_ring_number"),
        dam_year: row.get("dam_year"),
        sire_id: row.get("sire_id"),
        dam_id: row.get("dam_id"),
        extra_fields: row.get("extra_fields"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    };

    Ok(new_pigeon)
}

#[tauri::command]
pub async fn update_pigeon(
    id: i64,
    pigeon_data: UpdatePigeonRequest,
    state: State<'_, AppState>,
) -> AppResult<Pigeon> {
    let row = sqlx::query(
        r#"
        UPDATE pigeons SET
            name = COALESCE(?, name),
            color = COALESCE(?, color),
            sex = COALESCE(?, sex),
            strain = COALESCE(?, strain),
            loft = COALESCE(?, loft),
            status = COALESCE(?, status),
            image_path = COALESCE(?, image_path),
            sire_ring_number = COALESCE(?, sire_ring_number),
            sire_year = COALESCE(?, sire_year),
            dam_ring_number = COALESCE(?, dam_ring_number),
            dam_year = COALESCE(?, dam_year),
            sire_id = COALESCE(?, sire_id),
            dam_id = COALESCE(?, dam_id),
            extra_fields = COALESCE(?, extra_fields),
            updated_at = ?
        WHERE id = ?
        RETURNING
            id, ring_number, year, name, color, sex, strain, loft, status,
            image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
            sire_id, dam_id, extra_fields, created_at, updated_at
        "#
    )
    .bind(&pigeon_data.name)
    .bind(&pigeon_data.color)
    .bind(pigeon_data.sex)
    .bind(&pigeon_data.strain)
    .bind(&pigeon_data.loft)
    .bind(pigeon_data.status)
    .bind(&pigeon_data.image_path)
    .bind(&pigeon_data.sire_ring_number)
    .bind(pigeon_data.sire_year)
    .bind(&pigeon_data.dam_ring_number)
    .bind(pigeon_data.dam_year)
    .bind(pigeon_data.sire_id)
    .bind(pigeon_data.dam_id)
    .bind(&pigeon_data.extra_fields)
    .bind(chrono::Utc::now())
    .bind(id)
    .fetch_one(&state.db.pool)
    .await?;

    let updated_pigeon = Pigeon {
        id: Some(row.get("id")),
        ring_number: row.get("ring_number"),
        year: row.get("year"),
        name: row.get("name"),
        color: row.get("color"),
        sex: row.get("sex"),
        strain: row.get("strain"),
        loft: row.get("loft"),
        status: row.get("status"),
        image_path: row.get("image_path"),
        sire_ring_number: row.get("sire_ring_number"),
        sire_year: row.get("sire_year"),
        dam_ring_number: row.get("dam_ring_number"),
        dam_year: row.get("dam_year"),
        sire_id: row.get("sire_id"),
        dam_id: row.get("dam_id"),
        extra_fields: row.get("extra_fields"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    };

    Ok(updated_pigeon)
}

#[tauri::command]
pub async fn delete_pigeon(
    id: i64,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let result = sqlx::query("DELETE FROM pigeons WHERE id = ?1")
        .bind(id)
        .execute(&state.db.pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

#[tauri::command]
pub async fn search_pigeons(
    params: PigeonSearchParams,
    state: State<'_, AppState>,
) -> AppResult<Vec<Pigeon>> {
    let limit = params.limit.unwrap_or(100);
    let offset = params.offset.unwrap_or(0);

    let rows = if let Some(search_query) = &params.query {
        let search_pattern = format!("%{}%", search_query);
        sqlx::query(
            r#"
            SELECT
                id, ring_number, year, name, color, sex, strain, loft, status,
                image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
                extra_fields, created_at, updated_at
            FROM pigeons
            WHERE ring_number LIKE ?1 OR name LIKE ?1 OR strain LIKE ?1
            ORDER BY created_at DESC
            LIMIT ?2 OFFSET ?3
            "#
        )
        .bind(search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db.pool)
        .await?
    } else {
        sqlx::query(
            r#"
            SELECT
                id, ring_number, year, name, color, sex, strain, loft, status,
                image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
                extra_fields, created_at, updated_at
            FROM pigeons
            ORDER BY created_at DESC
            LIMIT ?1 OFFSET ?2
            "#
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db.pool)
        .await?
    };

    let pigeons: Vec<Pigeon> = rows
        .into_iter()
        .map(|row| Pigeon {
            id: Some(row.get("id")),
            ring_number: row.get("ring_number"),
            year: row.get("year"),
            name: row.get("name"),
            color: row.get("color"),
            sex: row.get("sex"),
            strain: row.get("strain"),
            loft: row.get("loft"),
            status: row.get("status"),
            image_path: row.get("image_path"),
            sire_ring_number: row.get("sire_ring_number"),
            sire_year: row.get("sire_year"),
            dam_ring_number: row.get("dam_ring_number"),
            dam_year: row.get("dam_year"),
            sire_id: row.get("sire_id"),
            dam_id: row.get("dam_id"),
            extra_fields: row.get("extra_fields"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(pigeons)
}