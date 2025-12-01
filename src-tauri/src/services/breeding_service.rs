use crate::models::breeding::*;
use crate::models::pigeon::*;
use sqlx::{SqlitePool, Row};
use chrono::{Utc, Datelike};
use std::collections::HashMap;

/// 繁殖管理服务，提供繁殖相关的业务逻辑和高级算法
pub struct BreedingService {
    pool: SqlitePool,
}

impl BreedingService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// 分析配对兼容性，包括血缘关系、品种匹配度等因素
    pub async fn analyze_pair_compatibility(
        &self,
        sire_id: i64,
        dam_id: i64,
    ) -> crate::error::AppResult<PairCompatibilityAnalysis> {
        // 获取鸽子基本信息
        let sire = self.get_pigeon_details(sire_id).await?;
        let dam = self.get_pigeon_details(dam_id).await?;

        // 检查性别 (0: male, 1: female, 2: unknown)
        if sire.sex != 0 || dam.sex != 1 {
            return Err(crate::error::AppError::Validation(
                "配对性别错误，需要雄鸽和雌鸽".to_string()
            ));
        }

        // 计算血缘关系系数
        let relationship_coefficient = self.calculate_relationship_coefficient(sire_id, dam_id).await?;

        // 分析品种兼容性
        let breed_compatibility = self.analyze_breed_compatibility(&sire, &dam).await?;

        // 分析年龄适宜性
        let age_suitability = self.analyze_age_suitability(&sire, &dam).await?;

        // 分析健康状态兼容性
        let health_compatibility = self.analyze_health_compatibility(&sire, &dam).await?;

        // 计算综合兼容性分数
        let overall_score = Self::calculate_compatibility_score(
            relationship_coefficient,
            breed_compatibility.compatibility_score,
            age_suitability.score,
            health_compatibility.compatibility_score,
        );

        // 生成繁殖建议
        let recommendations = self.generate_breeding_recommendations(
            sire_id,
            dam_id,
            relationship_coefficient,
            overall_score,
        ).await?;

        Ok(PairCompatibilityAnalysis {
            sire_id,
            dam_id,
            relationship_coefficient,
            breed_compatibility,
            age_suitability,
            health_compatibility,
            overall_score,
            recommendations,
            analyzed_at: Utc::now(),
        })
    }

    /// 推荐最佳配对
    pub async fn recommend_best_pairs(
        &self,
        pigeon_id: i64,
        limit: Option<i32>,
    ) -> crate::error::AppResult<Vec<BreedingRecommendation>> {
        let limit = limit.unwrap_or(10);

        // 获取目标鸽子信息
        let target_pigeon = self.get_pigeon_details(pigeon_id).await?;

        // 确定目标性别和寻找相反性别的鸽子 (0: male, 1: female, 2: unknown)
        let target_sex = target_pigeon.sex;
        let search_sex = if target_sex == 0 { 1 } else { 0 };

        // 获取潜在配对候选
        let candidates = sqlx::query(
            r#"
            SELECT id, ring_number, name, sex, year, color, strain, loft, status
            FROM pigeons
            WHERE sex = ? AND id != ? AND status = 1
            ORDER BY strain, color
            LIMIT ?
            "#
        )
        .bind(search_sex)
        .bind(pigeon_id)
        .bind(limit * 2) // 获取更多候选以便筛选
        .fetch_all(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        let mut recommendations = Vec::new();

        for candidate_row in candidates {
            let candidate_id: i64 = candidate_row.get("id");

            // 分析每个候选的兼容性
            match self.analyze_pair_compatibility(pigeon_id, candidate_id).await {
                Ok(compatibility) => {
                    // 只推荐高兼容性的配对
                    if compatibility.overall_score >= 70.0 {
                        recommendations.push(BreedingRecommendation {
                            sire_id: if target_sex == 0 { pigeon_id } else { candidate_id },
                            dam_id: if target_sex == 0 { candidate_id } else { pigeon_id },
                            compatibility_score: compatibility.overall_score,
                            reasoning: self.generate_recommendation_reasoning(&compatibility),
                            expected_benefits: self.predict_breeding_benefits(&compatibility),
                            potential_risks: self.identify_breeding_risks(&compatibility),
                            recommended_at: Utc::now(),
                        });
                    }
                }
                Err(_) => {
                    // 跳过分析失败的候选
                    continue;
                }
            }
        }

        // 按兼容性分数排序
        recommendations.sort_by(|a, b| b.compatibility_score.partial_cmp(&a.compatibility_score).unwrap());

        // 限制结果数量
        recommendations.truncate(limit as usize);

        Ok(recommendations)
    }

    /// 分析繁殖性能趋势
    pub async fn analyze_breeding_performance_trends(
        &self,
        pair_id: i64,
    ) -> crate::error::AppResult<BreedingPerformanceTrend> {
        // 获取配对的所有繁殖记录
        let records = sqlx::query(
            r#"
            SELECT clutch_number, egg_count, hatched_count, fledged_count,
                   first_egg_date, created_at
            FROM breeding_records
            WHERE pair_id = ?
            ORDER BY clutch_number
            "#
        )
        .bind(pair_id)
        .fetch_all(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        if records.is_empty() {
            return Err(crate::error::AppError::NotFound("该配对暂无繁殖记录".to_string()));
        }

        // 计算趋势指标
        let total_clutches = records.len() as i32;
        let mut total_eggs = 0;
        let mut total_hatched = 0;
        let mut total_fledged = 0;

        for record in &records {
            total_eggs += record.get::<i32, _>("egg_count");
            total_hatched += record.get::<i32, _>("hatched_count");
            total_fledged += record.get::<i32, _>("fledged_count");
        }

        let average_eggs = total_eggs as f64 / total_clutches as f64;
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

        // 分析性能趋势（简化版，实际应用中可以使用更复杂的算法）
        let performance_trend = if records.len() >= 3 {
            // 比较最近3窝与之前的表现
            let recent_performance = self.calculate_recent_performance(&records, 3);
            let overall_performance = average_hatch_rate + average_fledge_rate;

            if recent_performance > overall_performance + 5.0 {
                "improving"
            } else if recent_performance < overall_performance - 5.0 {
                "declining"
            } else {
                "stable"
            }
        } else {
            "insufficient_data"
        };

        Ok(BreedingPerformanceTrend {
            pair_id,
            total_clutches,
            average_eggs_per_clutch: average_eggs,
            average_hatch_rate,
            average_fledge_rate,
            performance_trend: performance_trend.to_string(),
            analyzed_at: Utc::now(),
        })
    }

    /// 优化繁殖计划建议
    pub async fn optimize_breeding_schedule(
        &self,
        active_pairs: Vec<i64>,
    ) -> crate::error::AppResult<BreedingScheduleOptimization> {
        let mut optimization = BreedingScheduleOptimization {
            total_pairs: active_pairs.len(),
            optimized_schedule: Vec::new(),
            resource_utilization: HashMap::new(),
            recommendations: Vec::new(),
            generated_at: Utc::now(),
        };

        // 获取可用的巢箱数量
        let available_nest_boxes: i64 = sqlx::query("SELECT COUNT(*) as count FROM nest_boxes WHERE status = 'available'")
            .fetch_one(&self.pool)
            .await
            .map_err(crate::error::AppError::Database)?
            .get("count");

        // 分析每对配对的状况
        for pair_id in &active_pairs {
            let pair_analysis = self.analyze_pair_suitability(*pair_id).await?;

            optimization.optimized_schedule.push(BreedingScheduleItem {
                pair_id: *pair_id,
                recommended_action: pair_analysis.recommended_action,
                priority: pair_analysis.priority,
                estimated_timeline: pair_analysis.estimated_timeline,
                resource_requirements: pair_analysis.resource_requirements,
            });
        }

        // 按优先级排序
        optimization.optimized_schedule.sort_by(|a, b| b.priority.cmp(&a.priority));

        // 生成资源利用率分析
        optimization.resource_utilization.insert("nest_boxes".to_string(),
            format!("{}/{}", active_pairs.len(), available_nest_boxes));

        // 生成总体建议
        optimization.recommendations = self.generate_schedule_recommendations(&optimization);

        Ok(optimization)
    }

    // 辅助方法

    /// 获取鸽子详细信息
    async fn get_pigeon_details(&self, pigeon_id: i64) -> crate::error::AppResult<Pigeon> {
        let row = sqlx::query(
            r#"
            SELECT id, ring_number, name, sex, year, color, strain, loft, status,
                   image_path, sire_ring_number, sire_year, dam_ring_number, dam_year,
                   sire_id, dam_id, extra_fields, created_at, updated_at
            FROM pigeons
            WHERE id = ?
            "#
        )
        .bind(pigeon_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        match row {
            Some(row) => Ok(Pigeon {
                id: Some(row.get("id")),
                ring_number: row.get("ring_number"),
                year: row.get("year"),
                name: row.get("name"),
                sex: row.get("sex"),
                color: row.get("color"),
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
            }),
            None => Err(crate::error::AppError::NotFound("鸽子不存在".to_string()))
        }
    }

    /// 计算血缘关系系数
    async fn calculate_relationship_coefficient(&self, sire_id: i64, dam_id: i64) -> crate::error::AppResult<f64> {
        // 简化版血缘计算，实际应用中应该使用更复杂的算法
        // 这里使用SQL查询来检查近亲关系

        // 检查是否为父母子女关系
        let parent_child_check = sqlx::query(
            "SELECT COUNT(*) as count FROM pigeons WHERE (sire_id = ? AND id = ?) OR (dam_id = ? AND id = ?)"
        )
        .bind(sire_id)
        .bind(dam_id)
        .bind(dam_id)
        .bind(sire_id)
        .fetch_one(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        let parent_child_count: i64 = parent_child_check.get("count");
        if parent_child_count > 0 {
            return Ok(25.0); // 父母子女关系系数
        }

        // 检查是否为全同胞关系
        let sibling_check = sqlx::query(
            "SELECT COUNT(*) as count FROM pigeons p1, pigeons p2 WHERE p1.sire_id = p2.sire_id AND p1.dam_id = p2.dam_id AND p1.id = ? AND p2.id = ? AND p1.id != p2.id"
        )
        .bind(sire_id)
        .bind(dam_id)
        .fetch_one(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        let sibling_count: i64 = sibling_check.get("count");
        if sibling_count > 0 {
            return Ok(25.0); // 全同胞关系系数
        }

        // 检查是否为半同胞关系
        let half_sibling_check = sqlx::query(
            "SELECT COUNT(*) as count FROM pigeons p1, pigeons p2 WHERE (p1.sire_id = p2.sire_id OR p1.dam_id = p2.dam_id) AND p1.id = ? AND p2.id = ? AND p1.id != p2.id"
        )
        .bind(sire_id)
        .bind(dam_id)
        .fetch_one(&self.pool)
        .await
        .map_err(crate::error::AppError::Database)?;

        let half_sibling_count: i64 = half_sibling_check.get("count");
        if half_sibling_count > 0 {
            return Ok(12.5); // 半同胞关系系数
        }

        Ok(0.0) // 无明显血缘关系
    }

    /// 分析品种兼容性
    async fn analyze_breed_compatibility(&self, sire: &Pigeon, dam: &Pigeon) -> crate::error::AppResult<BreedCompatibility> {
        let compatibility_score = if let (Some(sire_strain), Some(dam_strain)) = (&sire.strain, &dam.strain) {
            if sire_strain == dam_strain {
                85.0 // 同品种高兼容性
            } else {
                70.0 // 不同品种中等兼容性
            }
        } else {
            60.0 // 品种信息不完整
        };

        Ok(BreedCompatibility {
            sire_strain: sire.strain.clone(),
            dam_strain: dam.strain.clone(),
            compatibility_score,
            advantages: vec![
                "品种纯度保持".to_string(),
                "遗传稳定性好".to_string(),
            ],
            considerations: vec![
                "避免过度近亲繁殖".to_string(),
                "注意遗传多样性".to_string(),
            ],
        })
    }

    /// 分析年龄适宜性
    async fn analyze_age_suitability(&self, sire: &Pigeon, dam: &Pigeon) -> crate::error::AppResult<AgeSuitability> {
        let current_year = Utc::now().year() as i32;

        let sire_age = current_year - sire.year;
        let dam_age = current_year - dam.year;

        // 理想繁殖年龄：雄鸽2-6岁，雌鸽1-5岁
        let sire_suitability = if sire_age >= 2 && sire_age <= 6 { 90.0 } else { 60.0 };
        let dam_suitability = if dam_age >= 1 && dam_age <= 5 { 90.0 } else { 60.0 };

        let overall_score = (sire_suitability + dam_suitability) / 2.0;

        Ok(AgeSuitability {
            sire_age,
            dam_age,
            optimal_breeding_age: overall_score >= 80.0,
            score: overall_score,
            recommendations: if overall_score < 80.0 {
                vec!["建议选择更适宜繁殖年龄的鸽子".to_string()]
            } else {
                vec!["年龄适宜，可以进行繁殖".to_string()]
            },
        })
    }

    /// 分析健康状态兼容性
    async fn analyze_health_compatibility(&self, sire: &Pigeon, dam: &Pigeon) -> crate::error::AppResult<HealthCompatibility> {
        // 简化版健康分析，实际应用中需要更详细的健康记录
        // status: 1: active, other: inactive
        let compatibility_score = match (sire.status, dam.status) {
            (1, 1) => 90.0,
            (1, _) | (_, 1) => 70.0,
            _ => 50.0,
        };

        Ok(HealthCompatibility {
            sire_health_status: if sire.status == 1 { "active".to_string() } else { "inactive".to_string() },
            dam_health_status: if dam.status == 1 { "active".to_string() } else { "inactive".to_string() },
            compatibility_score,
            health_considerations: vec![
                "确保双方鸽子健康状态良好".to_string(),
                "定期进行健康检查".to_string(),
            ],
        })
    }

    /// 计算综合兼容性分数
    fn calculate_compatibility_score(
        relationship_coefficient: f64,
        breed_score: f64,
        age_score: f64,
        health_score: f64,
    ) -> f64 {
        // 权重分配：血缘30%，品种25%，年龄25%，健康20%
        let relationship_penalty = if relationship_coefficient > 12.5 {
            50.0 - relationship_coefficient
        } else {
            0.0
        };

        (breed_score * 0.25) + (age_score * 0.25) + (health_score * 0.20) +
        ((100.0 - relationship_penalty) * 0.30)
    }

    /// 生成繁殖建议
    async fn generate_breeding_recommendations(
        &self,
        sire_id: i64,
        dam_id: i64,
        relationship_coefficient: f64,
        compatibility_score: f64,
    ) -> crate::error::AppResult<Vec<String>> {
        let mut recommendations = Vec::new();

        if relationship_coefficient > 12.5 {
            recommendations.push("⚠️ 血缘关系较近，建议避免配对".to_string());
        }

        if compatibility_score >= 80.0 {
            recommendations.push("✅ 配对兼容性良好，推荐进行繁殖".to_string());
        } else if compatibility_score >= 60.0 {
            recommendations.push("⚠️ 配对兼容性中等，建议谨慎考虑".to_string());
        } else {
            recommendations.push("❌ 配对兼容性较低，不建议进行繁殖".to_string());
        }

        // 检查是否已有活跃配对
        let existing_pairs = sqlx::query("SELECT COUNT(*) as count FROM breeding_pairs WHERE (sire_id = ? OR dam_id = ? OR sire_id = ? OR dam_id = ?) AND status = 'active'")
            .bind(sire_id)
            .bind(sire_id)
            .bind(dam_id)
            .bind(dam_id)
            .fetch_one(&self.pool)
            .await
            .map_err(crate::error::AppError::Database)?;

        let existing_count: i64 = existing_pairs.get("count");
        if existing_count > 0 {
            recommendations.push("⚠️ 其中一只鸽子已存在活跃配对".to_string());
        }

        Ok(recommendations)
    }

    /// 生成推荐理由
    fn generate_recommendation_reasoning(&self, compatibility: &PairCompatibilityAnalysis) -> String {
        format!(
            "综合评分: {:.1}分，品种兼容性: {:.1}分，年龄适宜性: {:.1}分，健康状况: {:.1}分",
            compatibility.overall_score,
            compatibility.breed_compatibility.compatibility_score,
            compatibility.age_suitability.score,
            compatibility.health_compatibility.compatibility_score
        )
    }

    /// 预测繁殖收益
    fn predict_breeding_benefits(&self, compatibility: &PairCompatibilityAnalysis) -> Vec<String> {
        let mut benefits = Vec::new();

        if compatibility.overall_score >= 80.0 {
            benefits.push("预计孵化率和成活率较高".to_string());
        }

        if compatibility.breed_compatibility.compatibility_score >= 80.0 {
            benefits.push("后品种质优良".to_string());
        }

        if compatibility.age_suitability.optimal_breeding_age {
            benefits.push("繁殖成功率预期良好".to_string());
        }

        benefits
    }

    /// 识别繁殖风险
    fn identify_breeding_risks(&self, compatibility: &PairCompatibilityAnalysis) -> Vec<String> {
        let mut risks = Vec::new();

        if compatibility.relationship_coefficient > 12.5 {
            risks.push("近亲繁殖风险".to_string());
        }

        if compatibility.age_suitability.score < 70.0 {
            risks.push("年龄不适宜可能导致繁殖成功率降低".to_string());
        }

        if compatibility.health_compatibility.compatibility_score < 70.0 {
            risks.push("健康状况可能影响繁殖效果".to_string());
        }

        risks
    }

    /// 计算近期表现
    fn calculate_recent_performance(&self, records: &[sqlx::sqlite::SqliteRow], recent_count: usize) -> f64 {
        let recent_start = if records.len() > recent_count { records.len() - recent_count } else { 0 };

        let mut recent_total = 0.0;
        let mut recent_count_f64 = 0.0;

        for record in records.iter().skip(recent_start) {
            let egg_count: i32 = record.get("egg_count");
            let hatched_count: i32 = record.get("hatched_count");
            let fledged_count: i32 = record.get("fledged_count");

            if egg_count > 0 {
                let hatch_rate = (hatched_count as f64 / egg_count as f64) * 100.0;
                let fledge_rate = if hatched_count > 0 {
                    (fledged_count as f64 / hatched_count as f64) * 100.0
                } else { 0.0 };
                recent_total += hatch_rate + fledge_rate;
                recent_count_f64 += 2.0;
            }
        }

        if recent_count_f64 > 0.0 {
            recent_total / recent_count_f64
        } else {
            0.0
        }
    }

    /// 分析配对适宜性
    async fn analyze_pair_suitability(&self, pair_id: i64) -> crate::error::AppResult<PairSuitabilityAnalysis> {
        // 获取配对信息
        let pair_info = sqlx::query("SELECT sire_id, dam_id, status, pair_date FROM breeding_pairs WHERE id = ?")
            .bind(pair_id)
            .fetch_one(&self.pool)
            .await
            .map_err(crate::error::AppError::Database)?;

        let sire_id: i64 = pair_info.get("sire_id");
        let dam_id: i64 = pair_info.get("dam_id");
        let status: String = pair_info.get("status");

        // 分析兼容性
        let compatibility = self.analyze_pair_compatibility(sire_id, dam_id).await?;

        let (recommended_action, priority) = if status == "active" {
            if compatibility.overall_score >= 80.0 {
                ("continue_breeding".to_string(), 1)
            } else {
                ("consider_separation".to_string(), 2)
            }
        } else {
            ("evaluate_repairing".to_string(), 3)
        };

        Ok(PairSuitabilityAnalysis {
            recommended_action,
            priority,
            estimated_timeline: "2-4周".to_string(),
            resource_requirements: vec!["巢箱".to_string(), "饲料".to_string(), "医疗用品".to_string()],
        })
    }

    /// 生成时间表建议
    fn generate_schedule_recommendations(&self, optimization: &BreedingScheduleOptimization) -> Vec<String> {
        let mut recommendations = Vec::new();

        let high_priority_count = optimization.optimized_schedule.iter()
            .filter(|item| item.priority <= 2)
            .count();

        if high_priority_count > optimization.total_pairs / 2 {
            recommendations.push("建议优先处理高优先级配对".to_string());
        }

        if let Some(nest_box_usage) = optimization.resource_utilization.get("nest_boxes") {
            if nest_box_usage.contains("/") {
                recommendations.push("巢箱资源紧张，考虑增加巢箱或调整配对时间".to_string());
            }
        }

        recommendations.push("定期评估繁殖效果，及时调整计划".to_string());

        recommendations
    }
}

// 辅助结构体定义

#[derive(Debug, Clone)]
pub struct PairCompatibilityAnalysis {
    pub sire_id: i64,
    pub dam_id: i64,
    pub relationship_coefficient: f64,
    pub breed_compatibility: BreedCompatibility,
    pub age_suitability: AgeSuitability,
    pub health_compatibility: HealthCompatibility,
    pub overall_score: f64,
    pub recommendations: Vec<String>,
    pub analyzed_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BreedCompatibility {
    pub sire_strain: Option<String>,
    pub dam_strain: Option<String>,
    pub compatibility_score: f64,
    pub advantages: Vec<String>,
    pub considerations: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct AgeSuitability {
    pub sire_age: i32,
    pub dam_age: i32,
    pub optimal_breeding_age: bool,
    pub score: f64,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct HealthCompatibility {
    pub sire_health_status: String,
    pub dam_health_status: String,
    pub compatibility_score: f64,
    pub health_considerations: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct BreedingRecommendation {
    pub sire_id: i64,
    pub dam_id: i64,
    pub compatibility_score: f64,
    pub reasoning: String,
    pub expected_benefits: Vec<String>,
    pub potential_risks: Vec<String>,
    pub recommended_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BreedingPerformanceTrend {
    pub pair_id: i64,
    pub total_clutches: i32,
    pub average_eggs_per_clutch: f64,
    pub average_hatch_rate: f64,
    pub average_fledge_rate: f64,
    pub performance_trend: String,
    pub analyzed_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BreedingScheduleOptimization {
    pub total_pairs: usize,
    pub optimized_schedule: Vec<BreedingScheduleItem>,
    pub resource_utilization: HashMap<String, String>,
    pub recommendations: Vec<String>,
    pub generated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BreedingScheduleItem {
    pub pair_id: i64,
    pub recommended_action: String,
    pub priority: i32,
    pub estimated_timeline: String,
    pub resource_requirements: Vec<String>,
}

#[derive(Debug, Clone)]
struct PairSuitabilityAnalysis {
    pub recommended_action: String,
    pub priority: i32,
    pub estimated_timeline: String,
    pub resource_requirements: Vec<String>,
}