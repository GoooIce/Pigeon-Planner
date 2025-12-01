use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

/// 繁殖配对记录
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BreedingPair {
    pub id: Option<i64>,
    pub sire_id: i64,                // 雄鸽ID
    pub dam_id: i64,                  // 雌鸽ID
    pub pair_date: NaiveDate,         // 配对日期
    pub separate_date: Option<NaiveDate>, // 分离日期
    pub status: String,               // 配对状态: "active", "separated", "completed"
    pub nest_box_id: Option<i64>,     // 巢箱ID
    pub notes: Option<String>,        // 备注
    pub created_at: DateTime<Utc>,    // 创建时间
    pub updated_at: DateTime<Utc>,    // 更新时间
}

/// 繁殖记录详情（包含关联的鸽子信息）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreedingPairDetail {
    pub id: Option<i64>,
    pub sire_id: i64,
    pub dam_id: i64,
    pub sire_name: Option<String>,
    pub sire_ring_number: String,
    pub sire_color: Option<String>,
    pub sire_strain: Option<String>,
    pub dam_name: Option<String>,
    pub dam_ring_number: String,
    pub dam_color: Option<String>,
    pub dam_strain: Option<String>,
    pub pair_date: NaiveDate,
    pub separate_date: Option<NaiveDate>,
    pub status: String,
    pub nest_box_id: Option<i64>,
    pub nest_box_number: Option<String>,
    pub nest_location: Option<String>,
    pub notes: Option<String>,
    pub total_clutches: i64,          // 总窝数
    pub total_eggs: i64,              // 总蛋数
    pub total_hatched: i64,           // 总孵化数
    pub total_fledged: i64,           // 总出飞数
    pub hatch_rate: f64,               // 孵化率
    pub fledge_rate: f64,              // 出飞率
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 繁殖记录
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BreedingRecord {
    pub id: Option<i64>,
    pub pair_id: i64,                 // 配对ID
    pub clutch_number: i32,           // 窝数
    pub first_egg_date: Option<NaiveDate>,   // 第一枚蛋日期
    pub second_egg_date: Option<NaiveDate>,  // 第二枚蛋日期
    pub first_hatch_date: Option<NaiveDate>, // 第一只孵化日期
    pub second_hatch_date: Option<NaiveDate>,// 第二只孵化日期
    pub egg_count: i32,               // 蛋数
    pub hatched_count: i32,           // 孵化数
    pub fledged_count: i32,           // 出飞数
    pub first_chick_id: Option<i64>,   // 第一只幼鸽ID
    pub second_chick_id: Option<i64>,  // 第二只幼鸽ID
    pub notes: Option<String>,        // 备注
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 巢箱管理
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct NestBox {
    pub id: Option<i64>,
    pub box_number: String,           // 巢箱编号
    pub location: Option<String>,     // 位置
    pub status: String,               // 状态: "available", "occupied", "maintenance"
    pub current_pair_id: Option<i64>, // 当前配对ID
    pub notes: Option<String>,        // 备注
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 巢箱使用详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestBoxDetail {
    pub id: Option<i64>,
    pub box_number: String,
    pub location: Option<String>,
    pub status: String,
    pub current_pair_id: Option<i64>,
    pub current_pair_info: Option<BreedingPairSummary>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 配对摘要信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreedingPairSummary {
    pub id: Option<i64>,
    pub sire_ring_number: String,
    pub sire_name: Option<String>,
    pub dam_ring_number: String,
    pub dam_name: Option<String>,
    pub pair_date: NaiveDate,
    pub status: String,
}

/// 繁殖统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreedingStats {
    pub total_pairs: i64,             // 配对总数
    pub active_pairs: i64,            // 活跃配对数
    pub total_clutches: i64,          // 总窝数
    pub total_eggs: i64,              // 总蛋数
    pub total_hatched: i64,           // 总孵化数
    pub total_fledged: i64,           // 总出飞数
    pub average_hatch_rate: f64,      // 平均孵化率
    pub average_fledge_rate: f64,     // 平均出飞率
    pub available_nest_boxes: i64,    // 可用巢箱数
    pub best_performing_pair: Option<PairPerformance>, // 最佳配对
    pub current_year_stats: Option<YearlyStats>,       // 当年统计
}

/// 配对性能
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairPerformance {
    pub pair_id: i64,
    pub sire_ring_number: String,
    pub dam_ring_number: String,
    pub total_clutches: i64,
    pub total_eggs: i64,
    pub total_hatched: i64,
    pub total_fledged: i64,
    pub hatch_rate: f64,
    pub fledge_rate: f64,
    pub performance_score: f64,       // 综合性能评分
}

/// 年度统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearlyStats {
    pub year: i32,
    pub new_pairs: i64,               // 新增配对数
    pub clutches_produced: i64,       // 产蛋窝数
    pub eggs_produced: i64,           // 产蛋数
    pub chicks_hatched: i64,          // 孵化数
    pub chicks_fledged: i64,          // 出飞数
    pub hatch_rate: f64,
    pub fledge_rate: f64,
}

/// 配对兼容性分析
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairCompatibilityAnalysis {
    pub sire_id: i64,
    pub dam_id: i64,
    pub compatibility_score: f64,      // 兼容性评分 (0-100)
    pub inbreeding_coefficient: f64,  // 近交系数
    pub bloodline_complementarity: f64, // 血统互补性
    pub genetic_diversity: f64,       // 遗传多样性
    pub historical_performance: Option<f64>, // 历史表现
    pub recommendations: Vec<String>,  // 建议
    pub warnings: Vec<String>,        // 警告
    pub risk_level: String,           // 风险等级: "low", "medium", "high"
    pub analysis_summary: String,     // 分析摘要
}

/// 繁殖预测
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreedingPrediction {
    pub sire_id: i64,
    pub dam_id: i64,
    pub expected_hatch_rate: f64,     // 预期孵化率
    pub expected_fledge_rate: f64,    // 预期出飞率
    pub expected_clutch_size: f64,    // 预期窝蛋数
    pub genetic_quality_score: f64,   // 遗传质量评分
    pub success_probability: f64,     // 成功概率
    pub optimal_breeding_season: Vec<String>, // 最佳繁殖季节
    pub potential_issues: Vec<String>, // 潜在问题
}

/// 配对建议
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatingSuggestion {
    pub suggested_mate_id: i64,
    pub mate_ring_number: String,
    pub mate_name: Option<String>,
    pub compatibility_score: f64,
    pub relationship_type: String,     // 关系类型: "unrelated", "distant", "close"
    pub benefits: Vec<String>,        // 优势
    pub concerns: Vec<String>,        // 关注点
    pub recommendation_strength: String, // 推荐强度: "high", "medium", "low"
}

/// 创建配对请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBreedingPairRequest {
    pub sire_id: i64,
    pub dam_id: i64,
    pub pair_date: NaiveDate,
    pub nest_box_id: Option<i64>,
    pub notes: Option<String>,
}

/// 更新配对请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBreedingPairRequest {
    pub separate_date: Option<NaiveDate>,
    pub status: Option<String>,
    pub nest_box_id: Option<i64>,
    pub notes: Option<String>,
}

/// 创建繁殖记录请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBreedingRecordRequest {
    pub pair_id: i64,
    pub clutch_number: i32,
    pub egg_count: i32,
    pub first_egg_date: Option<NaiveDate>,
    pub second_egg_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

/// 更新繁殖记录请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBreedingRecordRequest {
    pub first_hatch_date: Option<NaiveDate>,
    pub second_hatch_date: Option<NaiveDate>,
    pub hatched_count: i32,
    pub fledged_count: i32,
    pub first_chick_id: Option<i64>,
    pub second_chick_id: Option<i64>,
    pub notes: Option<String>,
}

/// 巢箱分配请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignNestBoxRequest {
    pub pair_id: i64,
    pub nest_box_id: i64,
}

/// 繁殖查询参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreedingQueryParams {
    pub status: Option<String>,        // 配对状态过滤
    pub sire_id: Option<i64>,         // 雄鸽ID过滤
    pub dam_id: Option<i64>,          // 雌鸽ID过滤
    pub nest_box_id: Option<i64>,     // 巢箱ID过滤
    pub date_from: Option<NaiveDate>, // 开始日期
    pub date_to: Option<NaiveDate>,   // 结束日期
    pub limit: Option<i32>,           // 限制数量
    pub offset: Option<i32>,          // 偏移量
}

impl Default for BreedingQueryParams {
    fn default() -> Self {
        Self {
            status: None,
            sire_id: None,
            dam_id: None,
            nest_box_id: None,
            date_from: None,
            date_to: None,
            limit: Some(100),
            offset: Some(0),
        }
    }
}