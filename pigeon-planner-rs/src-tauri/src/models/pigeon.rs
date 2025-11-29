use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Pigeon {
    pub id: Option<i64>,
    pub ring_number: String,
    pub year: i32,
    pub name: Option<String>,
    pub color: Option<String>,
    pub sex: i32, // 0: male, 1: female, 2: unknown
    pub strain: Option<String>,
    pub loft: Option<String>,
    pub status: i32, // 1: active, other: inactive
    pub image_path: Option<String>,
    pub sire_ring_number: Option<String>,
    pub sire_year: Option<i32>,
    pub dam_ring_number: Option<String>,
    pub dam_year: Option<i32>,
    pub sire_id: Option<i64>,    // 新增：父鸽ID
    pub dam_id: Option<i64>,      // 新增：母鸽ID
    pub extra_fields: Option<String>, // JSON format
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePigeonRequest {
    pub ring_number: String,
    pub year: i32,
    pub name: Option<String>,
    pub color: Option<String>,
    pub sex: i32,
    pub strain: Option<String>,
    pub loft: Option<String>,
    pub image_path: Option<String>,
    pub sire_ring_number: Option<String>,
    pub sire_year: Option<i32>,
    pub dam_ring_number: Option<String>,
    pub dam_year: Option<i32>,
    pub sire_id: Option<i64>,      // 新增：父鸽ID
    pub dam_id: Option<i64>,        // 新增：母鸽ID
    pub extra_fields: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePigeonRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub sex: Option<i32>,
    pub strain: Option<String>,
    pub loft: Option<String>,
    pub status: Option<i32>,
    pub image_path: Option<String>,
    pub sire_ring_number: Option<String>,
    pub sire_year: Option<i32>,
    pub dam_ring_number: Option<String>,
    pub dam_year: Option<i32>,
    pub sire_id: Option<i64>,      // 新增：父鸽ID
    pub dam_id: Option<i64>,        // 新增：母鸽ID
    pub extra_fields: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PigeonSearchParams {
    pub query: Option<String>,
    pub sex: Option<i32>,
    pub year: Option<i32>,
    pub strain: Option<String>,
    pub loft: Option<String>,
    pub status: Option<i32>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

impl From<CreatePigeonRequest> for Pigeon {
    fn from(req: CreatePigeonRequest) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            ring_number: req.ring_number,
            year: req.year,
            name: req.name,
            color: req.color,
            sex: req.sex,
            strain: req.strain,
            loft: req.loft,
            status: 1, // Default to active
            image_path: req.image_path,
            sire_ring_number: req.sire_ring_number,
            sire_year: req.sire_year,
            dam_ring_number: req.dam_ring_number,
            dam_year: req.dam_year,
            sire_id: req.sire_id,
            dam_id: req.dam_id,
            extra_fields: req.extra_fields,
            created_at: now,
            updated_at: now,
        }
    }
}

// ===== 血统关系数据结构 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PedigreeNode {
    pub id: i32,
    pub ring_number: String,
    pub year: i32,
    pub name: Option<String>,
    pub sire_id: Option<i32>,  // 父鸽ID
    pub dam_id: Option<i32>,    // 母鸽ID
    pub generation: i32,        // 代际 (1: 本人, 2: 父母, 3: 祖父母, 4: 曾祖父母)
    pub sex: i32,              // 性别 (0: male, 1: female, 2: unknown)
    pub color: Option<String>,  // 颜色
    pub strain: Option<String>, // 品种
    pub loft: Option<String>,   // 鸽舍
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PedigreeTree {
    pub root_pigeon: PedigreeNode,
    pub ancestors: Vec<PedigreeNode>,
    pub descendants: Vec<PedigreeNode>,
    pub generations: i32,        // 查询的代数
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipResult {
    pub pigeon1_id: i32,
    pub pigeon2_id: i32,
    pub relationship_type: String, // "sire", "dam", "sibling", "half-sibling", "grandparent", etc.
    pub distance: i32,            // 血缘距离 (1: 父母, 2: 祖父母, etc.)
    pub common_ancestors: Vec<PedigreeNode>,
    pub relationship_description: String, // 关系描述，如 "父亲", "母亲", "同父异母的兄弟" 等
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BloodlineSearch {
    pub ancestor_id: Option<i32>,
    pub ring_number: Option<String>,
    pub year: Option<i32>,
    pub max_generations: Option<i32>,
    pub include_descendants: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParentRelationshipUpdate {
    pub pigeon_id: i32,
    pub sire_id: Option<i32>,
    pub dam_id: Option<i32>,
}

// 血统统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PedigreeStats {
    pub pigeon_id: i32,
    pub total_ancestors: i32,
    pub total_generations: i32,
    pub inbreeding_coefficient: Option<f64>, // Wright's inbreeding coefficient
    pub unique_ancestors: i32,
    pub sire_line_depth: i32,    // 父系深度
    pub dam_line_depth: i32,      // 母系深度
}