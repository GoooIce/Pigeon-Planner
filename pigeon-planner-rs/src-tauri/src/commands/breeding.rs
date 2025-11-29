use crate::models::breeding::*;
use sqlx::{SqlitePool, Row};
use tauri::State;
use chrono::NaiveDate;
use chrono::Datelike;

/// 创建繁殖配对
#[tauri::command]
pub async fn create_breeding_pair(
    sire_id: i64,
    dam_id: i64,
    pair_date: String,
    nest_box_id: Option<i64>,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<BreedingPair, String> {
    // 验证配对日期
    let pair_date = pair_date
        .parse::<chrono::NaiveDate>()
        .map_err(|e| format!("无效的配对日期格式: {}", e))?;

    // 验证性别
    let sire_check = sqlx::query("SELECT sex FROM pigeons WHERE id = ?")
        .bind(sire_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("查询雄鸽信息失败: {}", e))?;

    let sire_sex: String = sire_check.get("sex");
    if sire_sex != "male" {
        return Err("所选的雄鸽ID对应的鸽子性别不是雄性".to_string());
    }

    let dam_check = sqlx::query("SELECT sex FROM pigeons WHERE id = ?")
        .bind(dam_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("查询雌鸽信息失败: {}", e))?;

    let dam_sex: String = dam_check.get("sex");
    if dam_sex != "female" {
        return Err("所选的雌鸽ID对应的鸽子性别不是雌性".to_string());
    }

    // 验证是否已存在活跃配对
    let existing_pair = sqlx::query("SELECT COUNT(*) as count FROM breeding_pairs WHERE (sire_id = ? OR dam_id = ? OR sire_id = ? OR dam_id = ?) AND status = 'active'")
        .bind(sire_id)
        .bind(sire_id)
        .bind(dam_id)
        .bind(dam_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("检查现有配对失败: {}", e))?;

    let count: i64 = existing_pair.get("count");
    if count > 0 {
        return Err("其中一只鸽子已存在于活跃配对中".to_string());
    }

    // 验证巢箱可用性（如果指定了巢箱）
    if let Some(nest_box_id) = nest_box_id {
        let nest_box_check = sqlx::query("SELECT status, current_pair_id FROM nest_boxes WHERE id = ?")
            .bind(nest_box_id)
            .fetch_one(&*pool)
            .await
            .map_err(|e| format!("查询巢箱状态失败: {}", e))?;

        let status: String = nest_box_check.get("status");
        let current_pair_id: Option<i64> = nest_box_check.get("current_pair_id");

        if status != "available" && current_pair_id.is_some() {
            return Err("所选巢箱不可用".to_string());
        }
    }

    let result = sqlx::query(
        r#"
        INSERT INTO breeding_pairs (sire_id, dam_id, pair_date, nest_box_id, notes)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id, sire_id, dam_id, pair_date, separate_date, status, nest_box_id, notes, created_at, updated_at
        "#
    )
    .bind(sire_id)
    .bind(dam_id)
    .bind(pair_date)
    .bind(nest_box_id)
    .bind(notes)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("创建配对失败: {}", e))?;

    let breeding_pair = BreedingPair {
        id: Some(result.get("id")),
        sire_id: result.get("sire_id"),
        dam_id: result.get("dam_id"),
        pair_date: result.get("pair_date"),
        separate_date: result.get("separate_date"),
        status: result.get("status"),
        nest_box_id: result.get("nest_box_id"),
        notes: result.get("notes"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    };

    // 如果指定了巢箱，更新巢箱状态
    if let Some(nest_box_id) = nest_box_id {
        sqlx::query("UPDATE nest_boxes SET status = 'occupied', current_pair_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(breeding_pair.id.unwrap())
            .bind(nest_box_id)
            .execute(&*pool)
            .await
            .map_err(|e| format!("更新巢箱状态失败: {}", e))?;
    }

    Ok(breeding_pair)
}

/// 获取繁殖配对列表
#[tauri::command]
pub async fn get_breeding_pairs(
    limit: Option<i64>,
    offset: Option<i64>,
    status: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BreedingPairDetail>, String> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let pairs = if let Some(status) = status {
        let rows = sqlx::query(
            r#"
            SELECT
                bp.id, bp.sire_id, bp.dam_id, bp.pair_date, bp.separate_date, bp.status,
                bp.nest_box_id, bp.notes, bp.created_at, bp.updated_at,
                sire.name as sire_name, sire.ring_number as sire_ring_number, sire.color as sire_color, sire.strain as sire_strain,
                dam.name as dam_name, dam.ring_number as dam_ring_number, dam.color as dam_color, dam.strain as dam_strain,
                nb.box_number as nest_box_number, nb.location as nest_location,
                COALESCE(COUNT(br.id), 0) as total_clutches,
                COALESCE(SUM(br.egg_count), 0) as total_eggs,
                COALESCE(SUM(br.hatched_count), 0) as total_hatched,
                COALESCE(SUM(br.fledged_count), 0) as total_fledged,
                CASE
                    WHEN COALESCE(SUM(br.egg_count), 0) > 0
                    THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                    ELSE 0
                END as hatch_rate,
                CASE
                    WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                    THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                    ELSE 0
                END as fledge_rate
            FROM breeding_pairs bp
            LEFT JOIN pigeons sire ON bp.sire_id = sire.id
            LEFT JOIN pigeons dam ON bp.dam_id = dam.id
            LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
            LEFT JOIN breeding_records br ON bp.id = br.pair_id
            WHERE bp.status = ?
            GROUP BY bp.id
            ORDER BY bp.pair_date DESC
            LIMIT ? OFFSET ?
            "#
        )
        .bind(status)
        .bind(limit)
        .bind(offset)
        .fetch_all(&*pool)
        .await
        .map_err(|e| format!("获取配对列表失败: {}", e))?;

        rows.into_iter().map(|row| -> Result<BreedingPairDetail, sqlx::Error> {
            Ok(BreedingPairDetail {
                id: Some(row.get("id")),
                sire_id: row.get("sire_id"),
                dam_id: row.get("dam_id"),
                pair_date: row.get("pair_date"),
                separate_date: row.get("separate_date"),
                status: row.get("status"),
                nest_box_id: row.get("nest_box_id"),
                notes: row.get("notes"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                sire_name: row.get("sire_name"),
                sire_ring_number: row.get("sire_ring_number"),
                sire_color: row.get("sire_color"),
                sire_strain: row.get("sire_strain"),
                dam_name: row.get("dam_name"),
                dam_ring_number: row.get("dam_ring_number"),
                dam_color: row.get("dam_color"),
                dam_strain: row.get("dam_strain"),
                nest_box_number: row.get("nest_box_number"),
                nest_location: row.get("nest_location"),
                total_clutches: row.get("total_clutches"),
                total_eggs: row.get("total_eggs"),
                total_hatched: row.get("total_hatched"),
                total_fledged: row.get("total_fledged"),
                hatch_rate: row.get("hatch_rate"),
                fledge_rate: row.get("fledge_rate"),
            })
        }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射配对数据失败: {}", e))?
    } else {
        let rows = sqlx::query(
            r#"
            SELECT
                bp.id, bp.sire_id, bp.dam_id, bp.pair_date, bp.separate_date, bp.status,
                bp.nest_box_id, bp.notes, bp.created_at, bp.updated_at,
                sire.name as sire_name, sire.ring_number as sire_ring_number, sire.color as sire_color, sire.strain as sire_strain,
                dam.name as dam_name, dam.ring_number as dam_ring_number, dam.color as dam_color, dam.strain as dam_strain,
                nb.box_number as nest_box_number, nb.location as nest_location,
                COALESCE(COUNT(br.id), 0) as total_clutches,
                COALESCE(SUM(br.egg_count), 0) as total_eggs,
                COALESCE(SUM(br.hatched_count), 0) as total_hatched,
                COALESCE(SUM(br.fledged_count), 0) as total_fledged,
                CASE
                    WHEN COALESCE(SUM(br.egg_count), 0) > 0
                    THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                    ELSE 0
                END as hatch_rate,
                CASE
                    WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                    THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                    ELSE 0
                END as fledge_rate
            FROM breeding_pairs bp
            LEFT JOIN pigeons sire ON bp.sire_id = sire.id
            LEFT JOIN pigeons dam ON bp.dam_id = dam.id
            LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
            LEFT JOIN breeding_records br ON bp.id = br.pair_id
            GROUP BY bp.id
            ORDER BY bp.pair_date DESC
            LIMIT ? OFFSET ?
            "#
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&*pool)
        .await
        .map_err(|e| format!("获取配对列表失败: {}", e))?;

        rows.into_iter().map(|row| -> Result<BreedingPairDetail, sqlx::Error> {
            Ok(BreedingPairDetail {
                id: Some(row.get("id")),
                sire_id: row.get("sire_id"),
                dam_id: row.get("dam_id"),
                pair_date: row.get("pair_date"),
                separate_date: row.get("separate_date"),
                status: row.get("status"),
                nest_box_id: row.get("nest_box_id"),
                notes: row.get("notes"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                sire_name: row.get("sire_name"),
                sire_ring_number: row.get("sire_ring_number"),
                sire_color: row.get("sire_color"),
                sire_strain: row.get("sire_strain"),
                dam_name: row.get("dam_name"),
                dam_ring_number: row.get("dam_ring_number"),
                dam_color: row.get("dam_color"),
                dam_strain: row.get("dam_strain"),
                nest_box_number: row.get("nest_box_number"),
                nest_location: row.get("nest_location"),
                total_clutches: row.get("total_clutches"),
                total_eggs: row.get("total_eggs"),
                total_hatched: row.get("total_hatched"),
                total_fledged: row.get("total_fledged"),
                hatch_rate: row.get("hatch_rate"),
                fledge_rate: row.get("fledge_rate"),
            })
        }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射配对数据失败: {}", e))?
    };

    Ok(pairs)
}

/// 获取单个繁殖配对详情
#[tauri::command]
pub async fn get_breeding_pair_by_id(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<Option<BreedingPairDetail>, String> {
    let row = sqlx::query(
        r#"
        SELECT
            bp.id, bp.sire_id, bp.dam_id, bp.pair_date, bp.separate_date, bp.status,
            bp.nest_box_id, bp.notes, bp.created_at, bp.updated_at,
            sire.name as sire_name, sire.ring_number as sire_ring_number, sire.color as sire_color, sire.strain as sire_strain,
            dam.name as dam_name, dam.ring_number as dam_ring_number, dam.color as dam_color, dam.strain as dam_strain,
            nb.box_number as nest_box_number, nb.location as nest_location,
            COALESCE(COUNT(br.id), 0) as total_clutches,
            COALESCE(SUM(br.egg_count), 0) as total_eggs,
            COALESCE(SUM(br.hatched_count), 0) as total_hatched,
            COALESCE(SUM(br.fledged_count), 0) as total_fledged,
            CASE
                WHEN COALESCE(SUM(br.egg_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                ELSE 0
            END as hatch_rate,
            CASE
                WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                ELSE 0
            END as fledge_rate
        FROM breeding_pairs bp
        LEFT JOIN pigeons sire ON bp.sire_id = sire.id
        LEFT JOIN pigeons dam ON bp.dam_id = dam.id
        LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
        LEFT JOIN breeding_records br ON bp.id = br.pair_id
        WHERE bp.id = ?
        GROUP BY bp.id
        "#
    )
    .bind(id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| format!("获取配对详情失败: {}", e))?;

    match row {
        Some(row) => {
            let pair = BreedingPairDetail {
                id: Some(row.get("id")),
                sire_id: row.get("sire_id"),
                dam_id: row.get("dam_id"),
                pair_date: row.get("pair_date"),
                separate_date: row.get("separate_date"),
                status: row.get("status"),
                nest_box_id: row.get("nest_box_id"),
                notes: row.get("notes"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                sire_name: row.get("sire_name"),
                sire_ring_number: row.get("sire_ring_number"),
                sire_color: row.get("sire_color"),
                sire_strain: row.get("sire_strain"),
                dam_name: row.get("dam_name"),
                dam_ring_number: row.get("dam_ring_number"),
                dam_color: row.get("dam_color"),
                dam_strain: row.get("dam_strain"),
                nest_box_number: row.get("nest_box_number"),
                nest_location: row.get("nest_location"),
                total_clutches: row.get("total_clutches"),
                total_eggs: row.get("total_eggs"),
                total_hatched: row.get("total_hatched"),
                total_fledged: row.get("total_fledged"),
                hatch_rate: row.get("hatch_rate"),
                fledge_rate: row.get("fledge_rate"),
            };
            Ok(Some(pair))
        }
        None => Ok(None)
    }
}

/// 更新繁殖配对
#[tauri::command]
pub async fn update_breeding_pair(
    id: i64,
    separate_date: Option<String>,
    status: Option<String>,
    nest_box_id: Option<i64>,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<BreedingPair, String> {
    // 验证日期格式
    let separate_date = if let Some(date_str) = separate_date {
        Some(date_str.parse::<chrono::NaiveDate>()
            .map_err(|e| format!("无效的日期格式: {}", e))?)
    } else {
        None
    };

    // 验证巢箱可用性（如果指定了新巢箱）
    if let Some(nest_box_id) = nest_box_id {
        let nest_box_check = sqlx::query("SELECT status, current_pair_id FROM nest_boxes WHERE id = ?")
            .bind(nest_box_id)
            .fetch_one(&*pool)
            .await
            .map_err(|e| format!("查询巢箱失败: {}", e))?;

        let status: String = nest_box_check.get("status");
        let current_pair_id: Option<i64> = nest_box_check.get("current_pair_id");

        if status != "available" && current_pair_id != Some(id) {
            return Err("所选巢箱不可用".to_string());
        }
    }

    let result = sqlx::query(
        r#"
        UPDATE breeding_pairs
        SET separate_date = ?, status = ?, nest_box_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, sire_id, dam_id, pair_date, separate_date, status, nest_box_id, notes, created_at, updated_at
        "#
    )
    .bind(separate_date)
    .bind(status)
    .bind(nest_box_id)
    .bind(notes)
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("更新配对失败: {}", e))?;

    let breeding_pair = BreedingPair {
        id: Some(result.get("id")),
        sire_id: result.get("sire_id"),
        dam_id: result.get("dam_id"),
        pair_date: result.get("pair_date"),
        separate_date: result.get("separate_date"),
        status: result.get("status"),
        nest_box_id: result.get("nest_box_id"),
        notes: result.get("notes"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    };

    Ok(breeding_pair)
}

/// 删除繁殖配对
#[tauri::command]
pub async fn delete_breeding_pair(
    id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // 检查是否有相关的繁殖记录
    let record_count = sqlx::query("SELECT COUNT(*) as count FROM breeding_records WHERE pair_id = ?")
        .bind(id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("检查繁殖记录失败: {}", e))?;

    let count: i64 = record_count.get("count");
    if count > 0 {
        return Err("无法删除有繁殖记录的配对".to_string());
    }

    let result = sqlx::query("DELETE FROM breeding_pairs WHERE id = ?")
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| format!("删除配对失败: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("配对不存在".to_string());
    }

    Ok(())
}

/// 创建繁殖记录
#[tauri::command]
pub async fn create_breeding_record(
    pair_id: i64,
    clutch_number: i32,
    egg_count: i32,
    first_egg_date: Option<String>,
    second_egg_date: Option<String>,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<BreedingRecord, String> {
    // 验证配对存在
    let pair_exists = sqlx::query("SELECT COUNT(*) as count FROM breeding_pairs WHERE id = ?")
        .bind(pair_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("检查配对存在失败: {}", e))?;

    let count: i64 = pair_exists.get("count");
    if count == 0 {
        return Err("配对不存在".to_string());
    }

    // 验证日期格式
    let first_egg_date = if let Some(date_str) = first_egg_date {
        Some(date_str.parse::<chrono::NaiveDate>()
            .map_err(|e| format!("无效的第一枚蛋日期格式: {}", e))?)
    } else {
        None
    };

    let second_egg_date = if let Some(date_str) = second_egg_date {
        Some(date_str.parse::<chrono::NaiveDate>()
            .map_err(|e| format!("无效的第二枚蛋日期格式: {}", e))?)
    } else {
        None
    };

    let result = sqlx::query(
        r#"
        INSERT INTO breeding_records (
            pair_id, clutch_number, first_egg_date, second_egg_date,
            egg_count, hatched_count, fledged_count, notes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 0, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, pair_id, clutch_number, first_egg_date, second_egg_date,
                 first_hatch_date, second_hatch_date, egg_count, hatched_count, fledged_count,
                 first_chick_id, second_chick_id, notes, created_at, updated_at
        "#
    )
    .bind(pair_id)
    .bind(clutch_number)
    .bind(first_egg_date)
    .bind(second_egg_date)
    .bind(egg_count)
    .bind(notes)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("创建繁殖记录失败: {}", e))?;

    let breeding_record = BreedingRecord {
        id: Some(result.get("id")),
        pair_id: result.get("pair_id"),
        clutch_number: result.get("clutch_number"),
        first_egg_date: result.get("first_egg_date"),
        second_egg_date: result.get("second_egg_date"),
        first_hatch_date: result.get("first_hatch_date"),
        second_hatch_date: result.get("second_hatch_date"),
        egg_count: result.get("egg_count"),
        hatched_count: result.get("hatched_count"),
        fledged_count: result.get("fledged_count"),
        first_chick_id: result.get("first_chick_id"),
        second_chick_id: result.get("second_chick_id"),
        notes: result.get("notes"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    };

    Ok(breeding_record)
}

/// 获取配对的繁殖记录
#[tauri::command]
pub async fn get_breeding_records(
    pair_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BreedingRecord>, String> {
    let rows = sqlx::query(
        "SELECT id, pair_id, clutch_number, first_egg_date, second_egg_date,
                first_hatch_date, second_hatch_date, egg_count, hatched_count, fledged_count,
                first_chick_id, second_chick_id, notes, created_at, updated_at
         FROM breeding_records
         WHERE pair_id = ?
         ORDER BY clutch_number ASC"
    )
    .bind(pair_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("获取繁殖记录失败: {}", e))?;

    let records = rows.into_iter().map(|row| -> Result<BreedingRecord, sqlx::Error> {
        Ok(BreedingRecord {
            id: Some(row.get("id")),
            pair_id: row.get("pair_id"),
            clutch_number: row.get("clutch_number"),
            first_egg_date: row.get("first_egg_date"),
            second_egg_date: row.get("second_egg_date"),
            first_hatch_date: row.get("first_hatch_date"),
            second_hatch_date: row.get("second_hatch_date"),
            egg_count: row.get("egg_count"),
            hatched_count: row.get("hatched_count"),
            fledged_count: row.get("fledged_count"),
            first_chick_id: row.get("first_chick_id"),
            second_chick_id: row.get("second_chick_id"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射繁殖记录数据失败: {}", e))?;

    Ok(records)
}

/// 更新繁殖记录
#[tauri::command]
pub async fn update_breeding_record(
    id: i64,
    first_hatch_date: Option<String>,
    second_hatch_date: Option<String>,
    hatched_count: i32,
    fledged_count: i32,
    first_chick_id: Option<i64>,
    second_chick_id: Option<i64>,
    notes: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<BreedingRecord, String> {
    // 验证日期格式
    let first_hatch_date = if let Some(date_str) = first_hatch_date {
        Some(date_str.parse::<chrono::NaiveDate>()
            .map_err(|e| format!("无效的孵化日期格式: {}", e))?)
    } else {
        None
    };

    let second_hatch_date = if let Some(date_str) = second_hatch_date {
        Some(date_str.parse::<chrono::NaiveDate>()
            .map_err(|e| format!("无效的孵化日期格式: {}", e))?)
    } else {
        None
    };

    let result = sqlx::query(
        r#"
        UPDATE breeding_records
        SET first_hatch_date = ?, second_hatch_date = ?, hatched_count = ?,
            fledged_count = ?, first_chick_id = ?, second_chick_id = ?,
            notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, pair_id, clutch_number, first_egg_date, second_egg_date,
                 first_hatch_date, second_hatch_date, egg_count, hatched_count, fledged_count,
                 first_chick_id, second_chick_id, notes, created_at, updated_at
        "#
    )
    .bind(first_hatch_date)
    .bind(second_hatch_date)
    .bind(hatched_count)
    .bind(fledged_count)
    .bind(first_chick_id)
    .bind(second_chick_id)
    .bind(notes)
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("更新繁殖记录失败: {}", e))?;

    let breeding_record = BreedingRecord {
        id: Some(result.get("id")),
        pair_id: result.get("pair_id"),
        clutch_number: result.get("clutch_number"),
        first_egg_date: result.get("first_egg_date"),
        second_egg_date: result.get("second_egg_date"),
        first_hatch_date: result.get("first_hatch_date"),
        second_hatch_date: result.get("second_hatch_date"),
        egg_count: result.get("egg_count"),
        hatched_count: result.get("hatched_count"),
        fledged_count: result.get("fledged_count"),
        first_chick_id: result.get("first_chick_id"),
        second_chick_id: result.get("second_chick_id"),
        notes: result.get("notes"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    };

    Ok(breeding_record)
}

/// 获取所有巢箱
#[tauri::command]
pub async fn get_nest_boxes(
    status: Option<String>,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<NestBoxDetail>, String> {
    let nest_boxes = if let Some(status) = status {
        let rows = sqlx::query(
            r#"
            SELECT nb.id, nb.box_number, nb.location, nb.status, nb.current_pair_id, nb.notes, nb.created_at, nb.updated_at
            FROM nest_boxes nb
            WHERE nb.status = ?
            ORDER BY nb.box_number
            "#
        )
        .bind(status)
        .fetch_all(&*pool)
        .await
        .map_err(|e| format!("获取巢箱列表失败: {}", e))?;

        rows.into_iter().map(|row| -> Result<NestBoxDetail, sqlx::Error> {
            Ok(NestBoxDetail {
                id: Some(row.get("id")),
                box_number: row.get("box_number"),
                location: row.get("location"),
                status: row.get("status"),
                current_pair_id: row.get("current_pair_id"),
                notes: row.get("notes"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                current_pair_info: None, // 将在后面填充
            })
        }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射巢箱数据失败: {}", e))?
    } else {
        let rows = sqlx::query(
            r#"
            SELECT nb.id, nb.box_number, nb.location, nb.status, nb.current_pair_id, nb.notes, nb.created_at, nb.updated_at
            FROM nest_boxes nb
            ORDER BY nb.box_number
            "#
        )
        .fetch_all(&*pool)
        .await
        .map_err(|e| format!("获取巢箱列表失败: {}", e))?;

        rows.into_iter().map(|row| -> Result<NestBoxDetail, sqlx::Error> {
            Ok(NestBoxDetail {
                id: Some(row.get("id")),
                box_number: row.get("box_number"),
                location: row.get("location"),
                status: row.get("status"),
                current_pair_id: row.get("current_pair_id"),
                notes: row.get("notes"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                current_pair_info: None, // 将在后面填充
            })
        }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射巢箱数据失败: {}", e))?
    };

    // 为有当前配对的巢箱填充配对信息
    let mut detailed_boxes = Vec::new();
    for mut nest_box in nest_boxes {
        if let Some(pair_id) = nest_box.current_pair_id {
            let pair_row = sqlx::query(
                r#"
                SELECT bp.id, sire.ring_number as sire_ring_number, sire.name as sire_name,
                       dam.ring_number as dam_ring_number, dam.name as dam_name, bp.pair_date, bp.status
                FROM breeding_pairs bp
                LEFT JOIN pigeons sire ON bp.sire_id = sire.id
                LEFT JOIN pigeons dam ON bp.dam_id = dam.id
                WHERE bp.id = ?
                "#
            )
            .bind(pair_id)
            .fetch_optional(&*pool)
            .await
            .map_err(|e| format!("获取配对信息失败: {}", e))?;

            nest_box.current_pair_info = match pair_row {
                Some(row) => Some(BreedingPairSummary {
                    id: Some(row.get("id")),
                    sire_ring_number: row.get("sire_ring_number"),
                    sire_name: row.get("sire_name"),
                    dam_ring_number: row.get("dam_ring_number"),
                    dam_name: row.get("dam_name"),
                    pair_date: row.get("pair_date"),
                    status: row.get("status"),
                }),
                None => None
            };
        }
        detailed_boxes.push(nest_box);
    }

    Ok(detailed_boxes)
}

/// 分配巢箱给配对
#[tauri::command]
pub async fn assign_nest_box(
    pair_id: i64,
    nest_box_id: i64,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    // 验证配对存在且为活跃状态
    let pair_check = sqlx::query("SELECT COUNT(*) as count FROM breeding_pairs WHERE id = ? AND status = 'active'")
        .bind(pair_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("查询配对失败: {}", e))?;

    let count: i64 = pair_check.get("count");
    if count == 0 {
        return Err("配对不存在或不是活跃状态".to_string());
    }

    // 验证巢箱可用
    let nest_box_check = sqlx::query("SELECT COUNT(*) as count FROM nest_boxes WHERE id = ? AND status = 'available'")
        .bind(nest_box_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("查询巢箱失败: {}", e))?;

    let count: i64 = nest_box_check.get("count");
    if count == 0 {
        return Err("巢箱不存在或不可用".to_string());
    }

    // 更新配对的巢箱
    sqlx::query("UPDATE breeding_pairs SET nest_box_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(nest_box_id)
        .bind(pair_id)
        .execute(&*pool)
        .await
        .map_err(|e| format!("更新配对巢箱失败: {}", e))?;

    Ok(())
}

/// 获取繁殖统计信息
#[tauri::command]
pub async fn get_breeding_statistics(
    pool: State<'_, SqlitePool>,
) -> Result<BreedingStats, String> {
    let stats = sqlx::query(
        r#"
        SELECT
            (SELECT COUNT(*) FROM breeding_pairs) as total_pairs,
            (SELECT COUNT(*) FROM breeding_pairs WHERE status = 'active') as active_pairs,
            (SELECT COUNT(*) FROM breeding_records) as total_clutches,
            (SELECT COALESCE(SUM(egg_count), 0) FROM breeding_records) as total_eggs,
            (SELECT COALESCE(SUM(hatched_count), 0) FROM breeding_records) as total_hatched,
            (SELECT COALESCE(SUM(fledged_count), 0) FROM breeding_records) as total_fledged,
            (SELECT COUNT(*) FROM nest_boxes WHERE status = 'available') as available_nest_boxes
        "#
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("获取基础统计失败: {}", e))?;

    let total_pairs: i64 = stats.get("total_pairs");
    let active_pairs: i64 = stats.get("active_pairs");
    let total_clutches: i64 = stats.get("total_clutches");
    let total_eggs: i64 = stats.get("total_eggs");
    let total_hatched: i64 = stats.get("total_hatched");
    let total_fledged: i64 = stats.get("total_fledged");
    let available_nest_boxes: i64 = stats.get("available_nest_boxes");

    let average_hatch_rate = if total_eggs > 0 {
        (total_hatched as f64 / total_eggs as f64) * 100.0
    } else {
        0.0
    };

    let average_fledge_rate = if total_hatched > 0 {
        (total_fledged as f64 / total_hatched as f64) * 100.0
    } else {
        0.0
    };

    // 获取最佳配对
    let best_pair_row = sqlx::query(
        r#"
        SELECT
            bp.id as pair_id,
            sire.ring_number as sire_ring_number,
            dam.ring_number as dam_ring_number,
            COUNT(br.id) as total_clutches,
            COALESCE(SUM(br.egg_count), 0) as total_eggs,
            COALESCE(SUM(br.hatched_count), 0) as total_hatched,
            COALESCE(SUM(br.fledged_count), 0) as total_fledged,
            CASE
                WHEN COALESCE(SUM(br.egg_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                ELSE 0
            END as hatch_rate,
            CASE
                WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                ELSE 0
            END as fledge_rate,
            0 as performance_score -- TODO: 计算综合性能评分
        FROM breeding_pairs bp
        LEFT JOIN breeding_records br ON bp.id = br.pair_id
        LEFT JOIN pigeons sire ON bp.sire_id = sire.id
        LEFT JOIN pigeons dam ON bp.dam_id = dam.id
        WHERE bp.status = 'completed' OR (bp.status = 'active' AND EXISTS(SELECT 1 FROM breeding_records WHERE pair_id = bp.id))
        GROUP BY bp.id
        HAVING total_clutches >= 2
        ORDER BY (hatch_rate * 0.6 + fledge_rate * 0.4) DESC
        LIMIT 1
        "#
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| format!("获取最佳配对失败: {}", e))?;

    // 获取当年统计
    let current_year = chrono::Utc::now().year() as i32;
    let year_start = format!("{}-01-01", current_year);

    let current_year_stats_row = sqlx::query(
        r#"
        SELECT
            COUNT(*) as new_pairs,
            COUNT(br.id) as clutches_produced,
            COALESCE(SUM(br.egg_count), 0) as eggs_produced,
            COALESCE(SUM(br.hatched_count), 0) as chicks_hatched,
            COALESCE(SUM(br.fledged_count), 0) as chicks_fledged,
            CASE
                WHEN COALESCE(SUM(br.egg_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                ELSE 0
            END as hatch_rate,
            CASE
                WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                ELSE 0
            END as fledge_rate
        FROM breeding_pairs bp
        LEFT JOIN breeding_records br ON bp.id = br.pair_id
        WHERE bp.pair_date >= ?
        "#
    )
    .bind(year_start)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("获取当年统计失败: {}", e))?;

    let best_performing_pair = match best_pair_row {
        Some(row) => Some(PairPerformance {
            pair_id: row.get("pair_id"),
            sire_ring_number: row.get("sire_ring_number"),
            dam_ring_number: row.get("dam_ring_number"),
            total_clutches: row.get("total_clutches"),
            total_eggs: row.get("total_eggs"),
            total_hatched: row.get("total_hatched"),
            total_fledged: row.get("total_fledged"),
            hatch_rate: row.get("hatch_rate"),
            fledge_rate: row.get("fledge_rate"),
            performance_score: row.get("performance_score"),
        }),
        None => None
    };

    let current_year_stats = Some(YearlyStats {
        year: current_year,
        new_pairs: current_year_stats_row.get("new_pairs"),
        clutches_produced: current_year_stats_row.get("clutches_produced"),
        eggs_produced: current_year_stats_row.get("eggs_produced"),
        chicks_hatched: current_year_stats_row.get("chicks_hatched"),
        chicks_fledged: current_year_stats_row.get("chicks_fledged"),
        hatch_rate: current_year_stats_row.get("hatch_rate"),
        fledge_rate: current_year_stats_row.get("fledge_rate"),
    });

    let breeding_stats = BreedingStats {
        total_pairs,
        active_pairs,
        total_clutches,
        total_eggs,
        total_hatched,
        total_fledged,
        average_hatch_rate,
        average_fledge_rate,
        available_nest_boxes,
        best_performing_pair,
        current_year_stats,
    };

    Ok(breeding_stats)
}

/// 搜索配对
#[tauri::command]
pub async fn search_breeding_pairs(
    query: String,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BreedingPairDetail>, String> {
    let search_pattern = format!("%{}%", query);

    let rows = sqlx::query(
        r#"
        SELECT
            bp.id, bp.sire_id, bp.dam_id, bp.pair_date, bp.separate_date, bp.status,
            bp.nest_box_id, bp.notes, bp.created_at, bp.updated_at,
            sire.name as sire_name, sire.ring_number as sire_ring_number, sire.color as sire_color, sire.strain as sire_strain,
            dam.name as dam_name, dam.ring_number as dam_ring_number, dam.color as dam_color, dam.strain as dam_strain,
            nb.box_number as nest_box_number, nb.location as nest_location,
            COALESCE(COUNT(br.id), 0) as total_clutches,
            COALESCE(SUM(br.egg_count), 0) as total_eggs,
            COALESCE(SUM(br.hatched_count), 0) as total_hatched,
            COALESCE(SUM(br.fledged_count), 0) as total_fledged,
            CASE
                WHEN COALESCE(SUM(br.egg_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.hatched_count), 0) * 100.0 / COALESCE(SUM(br.egg_count), 0), 2)
                ELSE 0
            END as hatch_rate,
            CASE
                WHEN COALESCE(SUM(br.hatched_count), 0) > 0
                THEN ROUND(COALESCE(SUM(br.fledged_count), 0) * 100.0 / COALESCE(SUM(br.hatched_count), 0), 2)
                ELSE 0
            END as fledge_rate
        FROM breeding_pairs bp
        LEFT JOIN pigeons sire ON bp.sire_id = sire.id
        LEFT JOIN pigeons dam ON bp.dam_id = dam.id
        LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
        LEFT JOIN breeding_records br ON bp.id = br.pair_id
        WHERE sire.ring_number LIKE ? OR sire.name LIKE ?
           OR dam.ring_number LIKE ? OR dam.name LIKE ?
           OR CAST(nb.box_number AS TEXT) LIKE ? OR bp.notes LIKE ?
        GROUP BY bp.id
        ORDER BY bp.pair_date DESC
        LIMIT 50
        "#
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("搜索配对失败: {}", e))?;

    let pairs = rows.into_iter().map(|row| -> Result<BreedingPairDetail, sqlx::Error> {
        Ok(BreedingPairDetail {
            id: Some(row.get("id")),
            sire_id: row.get("sire_id"),
            dam_id: row.get("dam_id"),
            pair_date: row.get("pair_date"),
            separate_date: row.get("separate_date"),
            status: row.get("status"),
            nest_box_id: row.get("nest_box_id"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            sire_name: row.get("sire_name"),
            sire_ring_number: row.get("sire_ring_number"),
            sire_color: row.get("sire_color"),
            sire_strain: row.get("sire_strain"),
            dam_name: row.get("dam_name"),
            dam_ring_number: row.get("dam_ring_number"),
            dam_color: row.get("dam_color"),
            dam_strain: row.get("dam_strain"),
            nest_box_number: row.get("nest_box_number"),
            nest_location: row.get("nest_location"),
            total_clutches: row.get("total_clutches"),
            total_eggs: row.get("total_eggs"),
            total_hatched: row.get("total_hatched"),
            total_fledged: row.get("total_fledged"),
            hatch_rate: row.get("hatch_rate"),
            fledge_rate: row.get("fledge_rate"),
        })
    }).collect::<Result<Vec<_>, _>>().map_err(|e| format!("映射搜索配对数据失败: {}", e))?;

    Ok(pairs)
}