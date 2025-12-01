import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// 类型定义
export interface PedigreeNode {
  id: number;
  ring_number: string;
  year: number;
  name?: string;
  sire_id?: number;
  dam_id?: number;
  generation: number;
  sex: number; // 0: male, 1: female, 2: unknown
  color?: string;
  strain?: string;
  loft?: string;
}

export interface PedigreeTree {
  root_pigeon: PedigreeNode;
  ancestors: PedigreeNode[];
  descendants: PedigreeNode[];
  generations: number;
}

export interface RelationshipResult {
  pigeon1_id: number;
  pigeon2_id: number;
  relationship_type: string;
  distance: number;
  common_ancestors: PedigreeNode[];
  relationship_description: string;
}

export interface BloodlineSearch {
  ancestor_id?: number;
  ring_number?: string;
  year?: number;
  max_generations?: number;
  include_descendants?: boolean;
}

export interface ParentRelationshipUpdate {
  pigeon_id: number;
  sire_id?: number;
  dam_id?: number;
}

export interface PedigreeStats {
  pigeon_id: number;
  total_ancestors: number;
  total_generations: number;
  inbreeding_coefficient?: number;
  unique_ancestors: number;
  sire_line_depth: number;
  dam_line_depth: number;
}

// 高级分析类型
export interface AdvancedRelationshipAnalysis {
  pigeon1_id: number;
  pigeon2_id: number;
  relationship_type: string;
  relationship_coefficient: number;
  common_ancestors: PedigreeNode[];
  inbreeding_risk: 'Minimal' | 'Low' | 'Medium' | 'High';
  breeding_recommendation: string;
}

export interface BreedPurityAnalysis {
  pigeon_id: number;
  total_ancestors: number;
  strain_purity: StrainPurity[];
  purity_score: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  recommended_breeding_strategy: string;
}

export interface StrainPurity {
  strain: string;
  percentage: number;
  count: number;
}

export interface LineStrengthAnalysis {
  pigeon_id: number;
  sire_line_depth: number;
  dam_line_depth: number;
  sire_line_strength: number;
  dam_line_strength: number;
  dominant_line: 'Sire' | 'Dam' | 'Balanced';
  notable_ancestors: PedigreeNode[];
}

// API Keys
const QUERY_KEYS = {
  pedigree: (pigeonId: number, maxGenerations?: number) =>
    ['pedigree', pigeonId, maxGenerations] as const,
  relationship: (pigeon1Id: number, pigeon2Id: number) =>
    ['relationship', pigeon1Id, pigeon2Id] as const,
  bloodline: (search: BloodlineSearch) =>
    ['bloodline', search] as const,
  pedigreeStats: (pigeonId: number) =>
    ['pedigreeStats', pigeonId] as const,
  breedPurity: (pigeonId: number) =>
    ['breedPurity', pigeonId] as const,
  lineStrength: (pigeonId: number) =>
    ['lineStrength', pigeonId] as const,
  advancedRelationship: (pigeon1Id: number, pigeon2Id: number) =>
    ['advancedRelationship', pigeon1Id, pigeon2Id] as const,
};

// 1. 获取血统树
export function usePedigree(pigeonId: number, maxGenerations: number = 4) {
  return useQuery({
    queryKey: QUERY_KEYS.pedigree(pigeonId, maxGenerations),
    queryFn: async (): Promise<PedigreeTree> => {
      return await invoke('get_pigeon_pedigree', {
        pigeonId,
        maxGenerations,
      });
    },
    enabled: pigeonId > 0,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 2. 计算两只鸽子的关系
export function useRelationship(pigeon1Id: number, pigeon2Id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.relationship(pigeon1Id, pigeon2Id),
    queryFn: async (): Promise<RelationshipResult> => {
      return await invoke('calculate_relationship', {
        pigeon1Id,
        pigeon2Id,
      });
    },
    enabled: pigeon1Id > 0 && pigeon2Id > 0 && pigeon1Id !== pigeon2Id,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

// 3. 搜索血统
export function useBloodline(search: BloodlineSearch) {
  return useQuery({
    queryKey: QUERY_KEYS.bloodline(search),
    queryFn: async (): Promise<PedigreeNode[]> => {
      return await invoke('search_bloodline', { params: search });
    },
    enabled: !!search.ancestor_id || !!search.ring_number || !!search.year,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 4. 更新父母关系
export function useUpdateParentRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ParentRelationshipUpdate): Promise<boolean> => {
      return await invoke('update_parent_relationship', { update });
    },
    onSuccess: () => {
      // 使相关的查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['pedigree'] });
      queryClient.invalidateQueries({ queryKey: ['pigeons'] });
    },
  });
}

// 5. 获取血统统计
export function usePedigreeStats(pigeonId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.pedigreeStats(pigeonId),
    queryFn: async (): Promise<PedigreeStats> => {
      return await invoke('get_pedigree_stats', { pigeonId });
    },
    enabled: pigeonId > 0,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

// 6. 品种纯度分析
export function useBreedPurity(pigeonId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.breedPurity(pigeonId),
    queryFn: async (): Promise<BreedPurityAnalysis> => {
      // 注意：这个API可能还不存在，需要后端实现
      return await invoke('analyze_breed_purity', { pigeonId });
    },
    enabled: pigeonId > 0,
    staleTime: 30 * 60 * 1000, // 30分钟
  });
}

// 7. 血统线强度分析
export function useLineStrength(pigeonId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.lineStrength(pigeonId),
    queryFn: async (): Promise<LineStrengthAnalysis> => {
      // 注意：这个API可能还不存在，需要后端实现
      return await invoke('analyze_line_strength', { pigeonId });
    },
    enabled: pigeonId > 0,
    staleTime: 30 * 60 * 1000, // 30分钟
  });
}

// 8. 高级关系分析
export function useAdvancedRelationship(pigeon1Id: number, pigeon2Id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.advancedRelationship(pigeon1Id, pigeon2Id),
    queryFn: async (): Promise<AdvancedRelationshipAnalysis> => {
      // 注意：这个API可能还不存在，需要后端实现
      return await invoke('analyze_relationship', {
        pigeon1Id,
        pigeon2Id,
      });
    },
    enabled: pigeon1Id > 0 && pigeon2Id > 0 && pigeon1Id !== pigeon2Id,
    staleTime: 15 * 60 * 1000, // 15分钟
  });
}

// 组合Hook：完整的血统分析
export function useCompletePedigreeAnalysis(pigeonId: number) {
  const pedigree = usePedigree(pigeonId);
  const stats = usePedigreeStats(pigeonId);
  const breedPurity = useBreedPurity(pigeonId);
  const lineStrength = useLineStrength(pigeonId);

  return {
    pedigree,
    stats,
    breedPurity,
    lineStrength,
    isLoading: pedigree.isLoading || stats.isLoading ||
              breedPurity.isLoading || lineStrength.isLoading,
    error: pedigree.error || stats.error ||
           breedPurity.error || lineStrength.error,
  };
}

// 组合Hook：配对分析
export function useMatingAnalysis(pigeon1Id: number, pigeon2Id: number) {
  const basicRelationship = useRelationship(pigeon1Id, pigeon2Id);
  const advancedRelationship = useAdvancedRelationship(pigeon1Id, pigeon2Id);
  const updateParentRelationship = useUpdateParentRelationship();

  return {
    basicRelationship,
    advancedRelationship,
    updateParentRelationship,
    isLoading: basicRelationship.isLoading || advancedRelationship.isLoading,
    error: basicRelationship.error || advancedRelationship.error,
  };
}

// 工具函数：格式化关系类型
export function formatRelationshipType(type: string): string {
  const typeMap: Record<string, string> = {
    'sire': '父子',
    'dam': '母子',
    'sibling': '全同胞',
    'half-sibling': '半同胞',
    'grandparent': '祖孙',
    'unrelated': '无关系',
  };
  return typeMap[type] || type;
}

// 工具函数：格式化性别
export function formatSex(sex: number): string {
  const sexMap = {
    0: '雄性',
    1: '雌性',
    2: '未知',
  };
  return sexMap[sex as keyof typeof sexMap] || '未知';
}

// 工具函数：格式化近交风险
export function formatInbreedingRisk(risk: string): { text: string; color: string } {
  const riskMap = {
    'Minimal': { text: '极低', color: 'text-green-600' },
    'Low': { text: '低', color: 'text-blue-600' },
    'Medium': { text: '中等', color: 'text-yellow-600' },
    'High': { text: '高', color: 'text-red-600' },
  };
  return riskMap[risk as keyof typeof riskMap] || { text: risk, color: 'text-gray-600' };
}

// 工具函数：格式化纯度分数
export function formatPurityScore(score: string): { text: string; color: string } {
  const scoreMap = {
    'Excellent': { text: '优秀', color: 'text-green-600' },
    'Good': { text: '良好', color: 'text-blue-600' },
    'Fair': { text: '一般', color: 'text-yellow-600' },
    'Poor': { text: '较差', color: 'text-red-600' },
  };
  return scoreMap[score as keyof typeof scoreMap] || { text: score, color: 'text-gray-600' };
}

// 工具函数：生成血统树数据结构（用于可视化）
export function generatePedigreeTreeData(pedigree: PedigreeTree) {
  const { root_pigeon, ancestors } = pedigree;

  // 构建树形结构
  const buildTree = (pigeonId: number, generation: number): any => {
    const pigeon = ancestors.find(p => p.id === pigeonId);
    if (!pigeon) return null;

    return {
      id: pigeon.id,
      name: pigeon.name || pigeon.ring_number,
      ring_number: pigeon.ring_number,
      year: pigeon.year,
      sex: pigeon.sex,
      generation: pigeon.generation,
      strain: pigeon.strain,
      color: pigeon.color,
      children: [
        pigeon.sire_id ? buildTree(pigeon.sire_id, generation + 1) : null,
        pigeon.dam_id ? buildTree(pigeon.dam_id, generation + 1) : null,
      ].filter(Boolean),
    };
  };

  return {
    id: root_pigeon.id,
    name: root_pigeon.name || root_pigeon.ring_number,
    ring_number: root_pigeon.ring_number,
    year: root_pigeon.year,
    sex: root_pigeon.sex,
    generation: root_pigeon.generation,
    strain: root_pigeon.strain,
    color: root_pigeon.color,
    children: [
      root_pigeon.sire_id ? buildTree(root_pigeon.sire_id, 2) : null,
      root_pigeon.dam_id ? buildTree(root_pigeon.dam_id, 2) : null,
    ].filter(Boolean),
  };
}

// 工具函数：计算血缘关系的颜色编码
export function getRelationshipColor(coefficient: number): string {
  if (coefficient >= 0.25) return '#ef4444'; // 红色 - 高风险
  if (coefficient >= 0.125) return '#f59e0b'; // 橙色 - 中等风险
  if (coefficient >= 0.0625) return '#eab308'; // 黄色 - 低风险
  return '#22c55e'; // 绿色 - 极低风险
}