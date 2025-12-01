use crate::models::pigeon::*;
use sqlx::{SqlitePool, Row};
use std::collections::{HashMap, HashSet};

/// 血统分析服务，提供高级血统关系算法和业务逻辑
pub struct PedigreeService {
    pool: SqlitePool,
}

impl PedigreeService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// 获取完整的血统树，包括祖先和后代
    pub async fn get_complete_pedigree(&self, pigeon_id: i32, max_generations: i32) -> crate::error::AppResult<PedigreeTree> {
        // 获取根鸽子
        let root = self.get_pigeon_details(pigeon_id).await?;

        // 获取所有祖先
        let ancestors = self.get_all_ancestors(pigeon_id, max_generations).await?;

        // 获取所有后代
        let descendants = self.get_all_descendants(pigeon_id, max_generations).await?;

        Ok(PedigreeTree {
            root_pigeon: root,
            ancestors,
            descendants,
            generations: max_generations,
        })
    }

    /// 高级关系分析，包括亲缘系数计算
    pub async fn analyze_relationship(
        &self,
        pigeon1_id: i32,
        pigeon2_id: i32,
    ) -> crate::error::AppResult<AdvancedRelationshipAnalysis> {
        // 获取两只鸽子的完整血统
        let pedigree1 = self.get_all_ancestors(pigeon1_id, 10).await?;
        let pedigree2 = self.get_all_ancestors(pigeon2_id, 10).await?;

        // 找到共同祖先
        let common_ancestors = self.find_common_ancestors(&pedigree1, &pedigree2);

        // 计算亲缘系数（Wright's coefficient）
        let relationship_coefficient = self.calculate_relationship_coefficient(&common_ancestors, &pedigree1, &pedigree2);

        // 确定关系类型
        let relationship_type = self.determine_relationship_type(&common_ancestors, &pedigree1, &pedigree2);

        Ok(AdvancedRelationshipAnalysis {
            pigeon1_id,
            pigeon2_id,
            relationship_type,
            relationship_coefficient,
            common_ancestors,
            inbreeding_risk: self.assess_inbreeding_risk(relationship_coefficient),
            breeding_recommendation: self.generate_breeding_recommendation(relationship_coefficient),
        })
    }

    /// 计算近交系数（基于Wright's方法）
    pub async fn calculate_inbreeding_coefficient_advanced(&self, pigeon_id: i32) -> crate::error::AppResult<f64> {
        let pedigree = self.get_all_ancestors(pigeon_id, 10).await?;
        let mut coefficient = 0.0;

        // 创建祖先路径映射
        let ancestor_paths = self.build_ancestor_paths(&pedigree);

        // 检查每对共同祖先的贡献
        for (_ancestor_id, paths) in ancestor_paths {
            if paths.len() > 1 {
                // 有多条路径指向同一祖先，计算其近交贡献
                for i in 0..paths.len() {
                    for j in (i + 1)..paths.len() {
                        let path1 = &paths[i];
                        let path2 = &paths[j];

                        // 检查路径是否在父系和母系不同分支
                        if self.are_paths_independent(path1, path2, &pedigree) {
                            let contribution = 0.5_f64.powi(path1.len() as i32 + path2.len() as i32 + 1);
                            coefficient += contribution;
                        }
                    }
                }
            }
        }

        Ok(coefficient)
    }

    /// 品种纯度分析
    pub async fn analyze_breed_purity(&self, pigeon_id: i32) -> crate::error::AppResult<BreedPurityAnalysis> {
        let pedigree = self.get_all_ancestors(pigeon_id, 5).await?;
        let mut strain_counts = HashMap::new();
        let mut total_count = 0;

        // 统计品种分布
        for ancestor in &pedigree {
            if let Some(ref strain) = ancestor.strain {
                *strain_counts.entry(strain.clone()).or_insert(0) += 1;
                total_count += 1;
            }
        }

        // 计算纯度百分比
        let mut strain_purity = Vec::new();
        for (strain, count) in strain_counts {
            let percentage = (count as f64 / total_count as f64) * 100.0;
            strain_purity.push(StrainPurity {
                strain,
                percentage,
                count,
            });
        }

        // 按百分比排序
        strain_purity.sort_by(|a, b| b.percentage.partial_cmp(&a.percentage).unwrap());

        // 计算整体纯度分数
        let dominant_purity = strain_purity.first().map(|s| s.percentage).unwrap_or(0.0);
        let purity_score = if dominant_purity >= 90.0 {
            PurityScore::Excellent
        } else if dominant_purity >= 75.0 {
            PurityScore::Good
        } else if dominant_purity >= 50.0 {
            PurityScore::Fair
        } else {
            PurityScore::Poor
        };

        Ok(BreedPurityAnalysis {
            pigeon_id,
            total_ancestors: total_count,
            strain_purity: strain_purity.clone(),
            purity_score,
            recommended_breeding_strategy: self.recommend_breeding_strategy(&strain_purity),
        })
    }

    /// 血统线强度分析
    pub async fn analyze_line_strength(&self, pigeon_id: i32) -> crate::error::AppResult<LineStrengthAnalysis> {
        let sire_line = self.get_sire_line(pigeon_id, 10).await?;
        let dam_line = self.get_dam_line(pigeon_id, 10).await?;

        let sire_strength = self.calculate_line_strength_score(&sire_line);
        let dam_strength = self.calculate_line_strength_score(&dam_line);

        Ok(LineStrengthAnalysis {
            pigeon_id,
            sire_line_depth: sire_line.len() as i32,
            dam_line_depth: dam_line.len() as i32,
            sire_line_strength: sire_strength,
            dam_line_strength: dam_strength,
            dominant_line: if sire_strength > dam_strength {
                LineType::Sire
            } else if dam_strength > sire_strength {
                LineType::Dam
            } else {
                LineType::Balanced
            },
            notable_ancestors: self.find_notable_ancestors(&sire_line, &dam_line),
        })
    }

    /// 辅助方法：获取鸽子详细信息
    async fn get_pigeon_details(&self, pigeon_id: i32) -> crate::error::AppResult<PedigreeNode> {
        let row = sqlx::query(
            "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
             FROM pigeons WHERE id = ?1"
        )
        .bind(pigeon_id)
        .fetch_one(&self.pool)
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

    /// 辅助方法：获取所有祖先
    async fn get_all_ancestors(&self, pigeon_id: i32, max_generations: i32) -> crate::error::AppResult<Vec<PedigreeNode>> {
        let mut ancestors = Vec::new();
        let mut to_visit = vec![(pigeon_id, 2)]; // 从第2代开始

        while let Some((current_id, generation)) = to_visit.pop() {
            if generation > max_generations {
                continue;
            }

            if let Ok(row) = sqlx::query(
                "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
                 FROM pigeons WHERE id = ?1"
            )
            .bind(current_id)
            .fetch_one(&self.pool)
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

                // 添加父母到待访问列表
                if let Some(sire_id) = pigeon.sire_id {
                    to_visit.push((sire_id, generation + 1));
                }
                if let Some(dam_id) = pigeon.dam_id {
                    to_visit.push((dam_id, generation + 1));
                }
            }
        }

        Ok(ancestors)
    }

    /// 辅助方法：获取所有后代
    async fn get_all_descendants(&self, pigeon_id: i32, max_generations: i32) -> crate::error::AppResult<Vec<PedigreeNode>> {
        let mut descendants = Vec::new();
        let mut to_visit = vec![(pigeon_id, 2)]; // 从第2代开始

        while let Some((current_id, generation)) = to_visit.pop() {
            if generation > max_generations {
                continue;
            }

            let rows = sqlx::query(
                "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
                 FROM pigeons WHERE sire_id = ?1 OR dam_id = ?1"
            )
            .bind(current_id)
            .bind(current_id)
            .fetch_all(&self.pool)
            .await?;

            for row in rows {
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

                descendants.push(pigeon.clone());
                to_visit.push((pigeon.id, generation + 1));
            }
        }

        Ok(descendants)
    }

    /// 辅助方法：找到共同祖先
    fn find_common_ancestors(&self, pedigree1: &[PedigreeNode], pedigree2: &[PedigreeNode]) -> Vec<PedigreeNode> {
        let set1: HashSet<i32> = pedigree1.iter().map(|p| p.id).collect();
        let set2: HashSet<i32> = pedigree2.iter().map(|p| p.id).collect();

        let common_ids = set1.intersection(&set2);

        common_ids
            .filter_map(|&id| {
                pedigree1.iter()
                    .find(|p| p.id == id)
                    .cloned()
            })
            .collect()
    }

    /// 辅助方法：计算亲缘系数
    fn calculate_relationship_coefficient(
        &self,
        common_ancestors: &[PedigreeNode],
        pedigree1: &[PedigreeNode],
        pedigree2: &[PedigreeNode],
    ) -> f64 {
        if common_ancestors.is_empty() {
            return 0.0;
        }

        let mut total_coefficient = 0.0;

        for ancestor in common_ancestors {
            let path1_len = self.find_path_length_to_ancestor(pedigree1, ancestor.id);
            let path2_len = self.find_path_length_to_ancestor(pedigree2, ancestor.id);

            if let (Some(len1), Some(len2)) = (path1_len, path2_len) {
                total_coefficient += 0.5_f64.powi((len1 + len2) as i32);
            }
        }

        total_coefficient
    }

    /// 辅助方法：确定关系类型
    fn determine_relationship_type(
        &self,
        common_ancestors: &[PedigreeNode],
        _pedigree1: &[PedigreeNode],
        _pedigree2: &[PedigreeNode],
    ) -> String {
        if common_ancestors.is_empty() {
            "unrelated".to_string()
        } else if common_ancestors.len() == 1 {
            "half-sibling".to_string()
        } else {
            "full-sibling".to_string()
        }
    }

    /// 辅助方法：找到到祖先的路径长度
    fn find_path_length_to_ancestor(&self, pedigree: &[PedigreeNode], ancestor_id: i32) -> Option<i32> {
        pedigree.iter()
            .find(|p| p.id == ancestor_id)
            .map(|p| p.generation - 1)
    }

    /// 辅助方法：评估近交风险
    fn assess_inbreeding_risk(&self, coefficient: f64) -> InbreedingRisk {
        if coefficient >= 0.25 {
            InbreedingRisk::High
        } else if coefficient >= 0.125 {
            InbreedingRisk::Medium
        } else if coefficient >= 0.0625 {
            InbreedingRisk::Low
        } else {
            InbreedingRisk::Minimal
        }
    }

    /// 辅助方法：生成繁殖建议
    fn generate_breeding_recommendation(&self, coefficient: f64) -> String {
        match coefficient {
            c if c >= 0.25 => "不建议配对，近交系数过高".to_string(),
            c if c >= 0.125 => "需要谨慎考虑，建议选择更远的亲缘关系".to_string(),
            c if c >= 0.0625 => "可接受，但需注意后代健康".to_string(),
            _ => "推荐的配对，近交风险很低".to_string(),
        }
    }

    /// 辅助方法：构建祖先路径映射
    fn build_ancestor_paths(&self, pedigree: &[PedigreeNode]) -> HashMap<i32, Vec<Vec<i32>>> {
        let mut paths = HashMap::new();

        // 这里简化实现，实际需要构建从根到每个祖先的所有路径
        for ancestor in pedigree {
            paths.entry(ancestor.id).or_insert_with(Vec::new).push(vec![ancestor.id]);
        }

        paths
    }

    /// 辅助方法：检查路径是否独立
    fn are_paths_independent(&self, _path1: &[i32], _path2: &[i32], _pedigree: &[PedigreeNode]) -> bool {
        // 简化实现，实际需要检查路径是否在父系和母系不同分支
        true
    }

    /// 辅助方法：获取父系血统
    async fn get_sire_line(&self, pigeon_id: i32, max_generations: i32) -> crate::error::AppResult<Vec<PedigreeNode>> {
        let mut sire_line = Vec::new();
        let mut current_id = Some(pigeon_id);
        let mut generation = 1;

        while let Some(id) = current_id {
            if generation > max_generations {
                break;
            }

            if let Ok(row) = sqlx::query(
                "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
                 FROM pigeons WHERE id = ?1"
            )
            .bind(id)
            .fetch_one(&self.pool)
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

                current_id = pigeon.sire_id;
                sire_line.push(pigeon);
                generation += 1;
            } else {
                break;
            }
        }

        Ok(sire_line)
    }

    /// 辅助方法：获取母系血统
    async fn get_dam_line(&self, pigeon_id: i32, max_generations: i32) -> crate::error::AppResult<Vec<PedigreeNode>> {
        let mut dam_line = Vec::new();
        let mut current_id = Some(pigeon_id);
        let mut generation = 1;

        while let Some(id) = current_id {
            if generation > max_generations {
                break;
            }

            if let Ok(row) = sqlx::query(
                "SELECT id, ring_number, year, name, sex, color, strain, loft, sire_id, dam_id
                 FROM pigeons WHERE id = ?1"
            )
            .bind(id)
            .fetch_one(&self.pool)
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

                current_id = pigeon.dam_id;
                dam_line.push(pigeon);
                generation += 1;
            } else {
                break;
            }
        }

        Ok(dam_line)
    }

    /// 辅助方法：计算血统线强度分数
    fn calculate_line_strength_score(&self, line: &[PedigreeNode]) -> f64 {
        // 基于血统深度、知名祖先数量等计算强度分数
        let depth_score = (line.len() as f64).min(10.0) * 10.0; // 深度分数，最高100
        let notable_count = line.iter().filter(|p| {
            // 检查是否为知名祖先（简化实现）
            p.name.as_ref().map_or(false, |name| name.contains("冠军") || name.contains("名鸽"))
        }).count();
        let notable_score = (notable_count as f64) * 20.0; // 每个知名祖先20分

        (depth_score + notable_score).min(100.0)
    }

    /// 辅助方法：推荐繁殖策略
    fn recommend_breeding_strategy(&self, strain_purity: &[StrainPurity]) -> String {
        if strain_purity.is_empty() {
            return "建议纯系繁殖以建立稳定的品种特征".to_string();
        }

        let dominant_percentage = strain_purity[0].percentage;

        match dominant_percentage {
            p if p >= 90.0 => "品种纯度很高，建议进行异系引入以避免近交衰退".to_string(),
            p if p >= 75.0 => "品种纯度良好，可在保持纯度的同时适当引入新血".to_string(),
            p if p >= 50.0 => "品种纯度中等，建议进行纯系选育以提高纯度".to_string(),
            _ => "品种纯度较低，建议制定系统的繁殖计划以提高品种一致性".to_string(),
        }
    }

    /// 辅助方法：寻找著名祖先
    fn find_notable_ancestors(&self, sire_line: &[PedigreeNode], dam_line: &[PedigreeNode]) -> Vec<PedigreeNode> {
        sire_line.iter()
            .chain(dam_line.iter())
            .filter(|p| {
                p.name.as_ref().map_or(false, |name| {
                    name.contains("冠军") ||
                    name.contains("名鸽") ||
                    name.contains("王子") ||
                    name.contains("公主")
                })
            })
            .cloned()
            .collect()
    }
}

// 额外的数据结构定义
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AdvancedRelationshipAnalysis {
    pub pigeon1_id: i32,
    pub pigeon2_id: i32,
    pub relationship_type: String,
    pub relationship_coefficient: f64,
    pub common_ancestors: Vec<PedigreeNode>,
    pub inbreeding_risk: InbreedingRisk,
    pub breeding_recommendation: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum InbreedingRisk {
    Minimal,
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BreedPurityAnalysis {
    pub pigeon_id: i32,
    pub total_ancestors: i32,
    pub strain_purity: Vec<StrainPurity>,
    pub purity_score: PurityScore,
    pub recommended_breeding_strategy: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StrainPurity {
    pub strain: String,
    pub percentage: f64,
    pub count: i32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum PurityScore {
    Excellent,
    Good,
    Fair,
    Poor,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LineStrengthAnalysis {
    pub pigeon_id: i32,
    pub sire_line_depth: i32,
    pub dam_line_depth: i32,
    pub sire_line_strength: f64,
    pub dam_line_strength: f64,
    pub dominant_line: LineType,
    pub notable_ancestors: Vec<PedigreeNode>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum LineType {
    Sire,
    Dam,
    Balanced,
}