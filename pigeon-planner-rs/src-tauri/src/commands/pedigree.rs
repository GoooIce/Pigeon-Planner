use crate::{error::AppResult, models::pigeon::*, AppState};
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn get_pigeon_pedigree(
    pigeon_id: i64,
    max_generations: Option<i32>,
    state: State<'_, AppState>,
) -> AppResult<PedigreeTree> {
    let max_generations = max_generations.unwrap_or(4); // 默认查询4代
    let pigeon_id = pigeon_id as i32; // 转换为i32以匹配数据库类型

    // 首先获取根鸽子信息
    let root_row = sqlx::query(
        "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
         FROM pigeons WHERE id = ?1"
    )
    .bind(pigeon_id)
    .fetch_one(&state.db.pool)
    .await?;

    let root_pigeon = PedigreeNode {
        id: root_row.get("id"),
        ring_number: root_row.get("ring_number"),
        year: root_row.get("year"),
        name: root_row.get("name"),
        sire_id: root_row.get("sire_id"),
        dam_id: root_row.get("dam_id"),
        generation: 1, // 根节点是第1代
        sex: root_row.get("sex"),
        color: root_row.get("color"),
        strain: root_row.get("strain"),
        loft: root_row.get("loft"),
    };

    // 递归获取祖先
    let mut ancestors = Vec::new();
    collect_ancestors(&state.db.pool, root_pigeon.sire_id, 2, max_generations, &mut ancestors).await?;
    collect_ancestors(&state.db.pool, root_pigeon.dam_id, 2, max_generations, &mut ancestors).await?;

    // 获取后代（可选，这里简化实现）
    let descendants = Vec::new();

    Ok(PedigreeTree {
        root_pigeon,
        ancestors,
        descendants,
        generations: max_generations,
    })
}

#[tauri::command]
pub async fn calculate_relationship(
    pigeon1_id: i64,
    pigeon2_id: i64,
    state: State<'_, AppState>,
) -> AppResult<RelationshipResult> {
    let id1 = pigeon1_id as i32;
    let id2 = pigeon2_id as i32;

    // 获取两只鸽子的信息
    let pigeon1 = get_pigeon_by_id_internal(&state.db.pool, id1).await?;
    let pigeon2 = get_pigeon_by_id_internal(&state.db.pool, id2).await?;

    // 计算关系
    let (relationship_type, distance, common_ancestors) =
        calculate_relationship_between(&state.db.pool, id1, id2).await?;

    // 生成关系描述
    let relationship_description = generate_relationship_description(&relationship_type, distance, &pigeon1, &pigeon2);

    Ok(RelationshipResult {
        pigeon1_id: id1,
        pigeon2_id: id2,
        relationship_type,
        distance,
        common_ancestors,
        relationship_description,
    })
}

#[tauri::command]
pub async fn search_bloodline(
    params: BloodlineSearch,
    state: State<'_, AppState>,
) -> AppResult<Vec<PedigreeNode>> {
    // 简化实现：根据条件搜索鸽子
    let mut sql_query = sqlx::query(
        "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
         FROM pigeons
         WHERE (ring_number = ?1 OR ?1 IS NULL)
         AND (year = ?2 OR ?2 IS NULL)
         ORDER BY year DESC, ring_number"
    );

    // 使用Option处理可能为空的参数
    let ring_number = params.ring_number;
    let year = params.year;

    sql_query = sql_query.bind(ring_number).bind(year);

    let rows = sql_query.fetch_all(&state.db.pool).await?;

    let results: Vec<PedigreeNode> = rows
        .into_iter()
        .map(|row| PedigreeNode {
            id: row.get("id"),
            ring_number: row.get("ring_number"),
            year: row.get("year"),
            name: row.get("name"),
            sire_id: row.get("sire_id"),
            dam_id: row.get("dam_id"),
            generation: 1,
            sex: row.get("sex"),
            color: row.get("color"),
            strain: row.get("strain"),
            loft: row.get("loft"),
        })
        .collect();

    Ok(results)
}

#[tauri::command]
pub async fn update_parent_relationship(
    update: ParentRelationshipUpdate,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let result = sqlx::query(
        "UPDATE pigeons SET sire_id = COALESCE(?1, sire_id), dam_id = COALESCE(?2, dam_id), updated_at = CURRENT_TIMESTAMP
         WHERE id = ?3"
    )
    .bind(update.sire_id)
    .bind(update.dam_id)
    .bind(update.pigeon_id)
    .execute(&state.db.pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

#[tauri::command]
pub async fn get_pedigree_stats(
    pigeon_id: i64,
    state: State<'_, AppState>,
) -> AppResult<PedigreeStats> {
    let id = pigeon_id as i32;

    // 计算祖先统计
    let ancestors = collect_all_ancestors(&state.db.pool, id).await?;
    let total_ancestors = ancestors.len() as i32;

    // 计算代数深度
    let sire_line_depth = calculate_line_depth(&state.db.pool, id, true).await?;
    let dam_line_depth = calculate_line_depth(&state.db.pool, id, false).await?;
    let total_generations = sire_line_depth.max(dam_line_depth);

    // 计算唯一祖先数量（简化实现）
    let unique_ancestors = ancestors.len() as i32; // 这里简化，实际需要去重

    // 计算近交系数（简化实现）
    let inbreeding_coefficient = calculate_inbreeding_coefficient(&ancestors);

    Ok(PedigreeStats {
        pigeon_id: id,
        total_ancestors,
        total_generations,
        inbreeding_coefficient,
        unique_ancestors,
        sire_line_depth,
        dam_line_depth,
    })
}

// 辅助函数：迭代收集祖先
async fn collect_ancestors(
    pool: &sqlx::SqlitePool,
    parent_id: Option<i32>,
    generation: i32,
    max_generations: i32,
    ancestors: &mut Vec<PedigreeNode>,
) -> AppResult<()> {
    if let Some(parent_id) = parent_id {
        if generation > max_generations {
            return Ok(());
        }

        if let Ok(row) = sqlx::query(
            "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
             FROM pigeons WHERE id = ?1"
        )
        .bind(parent_id)
        .fetch_one(pool)
        .await
        {
            let pigeon = PedigreeNode {
                id: row.get("id"),
                ring_number: row.get("ring_number"),
                year: row.get("year"),
                name: row.get("name"),
                sire_id: row.get("sire_id"),
                dam_id: row.get("dam_id"),
                generation,
                sex: row.get("sex"),
                color: row.get("color"),
                strain: row.get("strain"),
                loft: row.get("loft"),
            };

            ancestors.push(pigeon.clone());

            // 使用Box::pin来处理递归异步调用
            if generation + 1 <= max_generations {
                Box::pin(collect_ancestors(pool, pigeon.sire_id, generation + 1, max_generations, ancestors)).await?;
                Box::pin(collect_ancestors(pool, pigeon.dam_id, generation + 1, max_generations, ancestors)).await?;
            }
        }
    }
    Ok(())
}

// 辅助函数：获取鸽子信息
async fn get_pigeon_by_id_internal(
    pool: &sqlx::SqlitePool,
    id: i32,
) -> AppResult<PedigreeNode> {
    let row = sqlx::query(
        "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
         FROM pigeons WHERE id = ?1"
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(PedigreeNode {
        id: row.get("id"),
        ring_number: row.get("ring_number"),
        year: row.get("year"),
        name: row.get("name"),
        sire_id: row.get("sire_id"),
        dam_id: row.get("dam_id"),
        generation: 1,
        sex: row.get("sex"),
        color: row.get("color"),
        strain: row.get("strain"),
        loft: row.get("loft"),
    })
}

// 辅助函数：计算两只鸽子的关系
async fn calculate_relationship_between(
    pool: &sqlx::SqlitePool,
    id1: i32,
    id2: i32,
) -> AppResult<(String, i32, Vec<PedigreeNode>)> {
    // 简化实现：检查是否为亲子关系
    if let Ok(parent) = get_pigeon_by_id_internal(pool, id1).await {
        if let Some(child_id) = parent.sire_id {
            if child_id == id2 {
                return Ok(("sire".to_string(), 1, vec![]));
            }
        }
        if let Some(child_id) = parent.dam_id {
            if child_id == id2 {
                return Ok(("dam".to_string(), 1, vec![]));
            }
        }
    }

    // 如果不是直接亲子关系，检查是否为全同胞
    let common_ancestors = find_common_ancestors(pool, id1, id2).await?;
    if !common_ancestors.is_empty() {
        return Ok(("sibling".to_string(), 2, common_ancestors));
    }

    // 默认返回无关系
    Ok(("unrelated".to_string(), 0, vec![]))
}

// 辅助函数：查找共同祖先
async fn find_common_ancestors(
    pool: &sqlx::SqlitePool,
    id1: i32,
    id2: i32,
) -> AppResult<Vec<PedigreeNode>> {
    let ancestors1 = collect_all_ancestors(pool, id1).await?;
    let ancestors2 = collect_all_ancestors(pool, id2).await?;

    let common = ancestors1.into_iter()
        .filter(|a1| ancestors2.iter().any(|a2| a1.id == a2.id))
        .collect();

    Ok(common)
}

// 辅助函数：收集所有祖先
async fn collect_all_ancestors(
    pool: &sqlx::SqlitePool,
    pigeon_id: i32,
) -> AppResult<Vec<PedigreeNode>> {
    let mut ancestors = Vec::new();
    collect_ancestors(pool, Some(pigeon_id), 1, 10, &mut ancestors).await?;
    Ok(ancestors)
}

// 辅助函数：计算血统深度
async fn calculate_line_depth(
    pool: &sqlx::SqlitePool,
    pigeon_id: i32,
    is_sire_line: bool,
) -> AppResult<i32> {
    let row = sqlx::query("SELECT sire_id, dam_id FROM pigeons WHERE id = ?1")
        .bind(pigeon_id)
        .fetch_one(pool)
        .await?;

    let parent_id = if is_sire_line {
        row.get("sire_id")
    } else {
        row.get("dam_id")
    };

    if let Some(parent_id) = parent_id {
        let child_depth = Box::pin(calculate_line_depth(pool, parent_id, is_sire_line)).await?;
        Ok(child_depth + 1)
    } else {
        Ok(0)
    }
}

// 辅助函数：计算近交系数（简化实现）
fn calculate_inbreeding_coefficient(ancestors: &[PedigreeNode]) -> Option<f64> {
    if ancestors.len() < 2 {
        return Some(0.0);
    }

    // 简化计算：检查是否有重复祖先
    let mut ids = std::collections::HashSet::new();
    let mut duplicates = 0;

    for ancestor in ancestors {
        if !ids.insert(ancestor.id) {
            duplicates += 1;
        }
    }

    if duplicates > 0 {
        Some(duplicates as f64 / ancestors.len() as f64)
    } else {
        Some(0.0)
    }
}

// 辅助函数：生成关系描述
fn generate_relationship_description(
    relationship_type: &str,
    _distance: i32,
    pigeon1: &PedigreeNode,
    pigeon2: &PedigreeNode,
) -> String {
    let name1 = pigeon1.name.as_ref().unwrap_or(&pigeon1.ring_number);
    let name2 = pigeon2.name.as_ref().unwrap_or(&pigeon2.ring_number);

    match relationship_type {
        "sire" => format!("{} 是 {} 的父亲", name1, name2),
        "dam" => format!("{} 是 {} 的母亲", name1, name2),
        "sibling" => format!("{} 和 {} 是全同胞关系", name1, name2),
        "half-sibling" => format!("{} 和 {} 是半同胞关系", name1, name2),
        "grandparent" => format!("{} 是 {} 的祖父母", name1, name2),
        _ => format!("{} 和 {} 无直接血缘关系", name1, name2),
    }
}