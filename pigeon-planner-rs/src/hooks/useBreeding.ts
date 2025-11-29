import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// 基础类型定义
export interface Pigeon {
  id: number;
  ring_number: string;
  year: number;
  name?: string;
  sex: number; // 0: male, 1: female, 2: unknown
  color?: string;
  strain?: string;
  loft?: string;
  status: number; // 1: active, other: inactive
  image_path?: string;
  sire_ring_number?: string;
  sire_year?: number;
  dam_ring_number?: string;
  dam_year?: number;
  sire_id?: number;
  dam_id?: number;
  created_at: string;
  updated_at: string;
}

// 繁殖配对相关类型
export interface BreedingPair {
  id?: number;
  sire_id: number;
  dam_id: number;
  pair_date: string;
  separate_date?: string;
  status: string; // "active", "separated", "completed"
  nest_box_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BreedingPairDetail extends BreedingPair {
  sire_name?: string;
  sire_ring_number: string;
  sire_color?: string;
  sire_strain?: string;
  dam_name?: string;
  dam_ring_number: string;
  dam_color?: string;
  dam_strain?: string;
  nest_box_number?: string;
  nest_location?: string;
  total_clutches: number;
  total_eggs: number;
  total_hatched: number;
  total_fledged: number;
  hatch_rate: number;
  fledge_rate: number;
}

// 繁殖记录相关类型
export interface BreedingRecord {
  id?: number;
  pair_id: number;
  clutch_number: number;
  first_egg_date?: string;
  second_egg_date?: string;
  first_hatch_date?: string;
  second_hatch_date?: string;
  egg_count: number;
  hatched_count: number;
  fledged_count: number;
  first_chick_id?: number;
  second_chick_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 巢箱相关类型
export interface NestBox {
  id?: number;
  box_number: string;
  location?: string;
  status: string; // "available", "occupied", "maintenance"
  current_pair_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NestBoxDetail extends NestBox {
  current_pair_info?: BreedingPairSummary;
}

export interface BreedingPairSummary {
  id?: number;
  sire_ring_number: string;
  sire_name?: string;
  dam_ring_number: string;
  dam_name?: string;
  pair_date: string;
  status: string;
}

// 统计相关类型
export interface BreedingStats {
  total_pairs: number;
  active_pairs: number;
  total_clutches: number;
  total_eggs: number;
  total_hatched: number;
  total_fledged: number;
  average_hatch_rate: number;
  average_fledge_rate: number;
  available_nest_boxes: number;
  best_performing_pair?: PairPerformance;
  current_year_stats?: YearlyStats;
}

export interface PairPerformance {
  pair_id: number;
  sire_ring_number: string;
  dam_ring_number: string;
  total_clutches: number;
  total_eggs: number;
  total_hatched: number;
  total_fledged: number;
  hatch_rate: number;
  fledge_rate: number;
  performance_score: number;
}

export interface YearlyStats {
  year: number;
  new_pairs: number;
  clutches_produced: number;
  eggs_produced: number;
  chicks_hatched: number;
  chicks_fledged: number;
  hatch_rate: number;
  fledge_rate: number;
}

// 请求类型
export interface CreateBreedingPairRequest {
  sire_id: number;
  dam_id: number;
  pair_date: string;
  nest_box_id?: number;
  notes?: string;
}

export interface UpdateBreedingPairRequest {
  id: number;
  separate_date?: string;
  status?: string;
  nest_box_id?: number;
  notes?: string;
}

export interface CreateBreedingRecordRequest {
  pair_id: number;
  clutch_number: number;
  egg_count: number;
  first_egg_date?: string;
  second_egg_date?: string;
  notes?: string;
}

export interface UpdateBreedingRecordRequest {
  id: number;
  first_hatch_date?: string;
  second_hatch_date?: string;
  hatched_count: number;
  fledged_count: number;
  first_chick_id?: number;
  second_chick_id?: number;
  notes?: string;
}

export interface AssignNestBoxRequest {
  pair_id: number;
  nest_box_id: number;
}

// ============ 繁殖配对管理 Hooks ============

// 获取繁殖配对列表
export function useBreedingPairs(limit?: number, offset?: number, status?: string) {
  return useQuery({
    queryKey: ['breeding-pairs', limit, offset, status],
    queryFn: () => invoke<BreedingPairDetail[]>('get_breeding_pairs', {
      limit,
      offset,
      status,
    }),
  });
}

// 获取单个繁殖配对详情
export function useBreedingPair(id: number) {
  return useQuery({
    queryKey: ['breeding-pair', id],
    queryFn: () => invoke<BreedingPairDetail | null>('get_breeding_pair_by_id', { id }),
    enabled: !!id,
  });
}

// 创建繁殖配对
export function useCreateBreedingPair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBreedingPairRequest) =>
      invoke<BreedingPair>('create_breeding_pair', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-stats'] });
      queryClient.invalidateQueries({ queryKey: ['nest-boxes'] });
    },
  });
}

// 更新繁殖配对
export function useUpdateBreedingPair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBreedingPairRequest) =>
      invoke<BreedingPair>('update_breeding_pair', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pair', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['breeding-stats'] });
    },
  });
}

// 删除繁殖配对
export function useDeleteBreedingPair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_breeding_pair', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-stats'] });
    },
  });
}

// 搜索繁殖配对
export function useSearchBreedingPairs(query: string) {
  return useQuery({
    queryKey: ['search-breeding-pairs', query],
    queryFn: () => invoke<BreedingPairDetail[]>('search_breeding_pairs', { query }),
    enabled: !!query && query.length > 0,
  });
}

// ============ 繁殖记录管理 Hooks ============

// 获取配对的繁殖记录
export function useBreedingRecords(pairId: number) {
  return useQuery({
    queryKey: ['breeding-records', pairId],
    queryFn: () => invoke<BreedingRecord[]>('get_breeding_records', { pair_id: pairId }),
    enabled: !!pairId,
  });
}

// 创建繁殖记录
export function useCreateBreedingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBreedingRecordRequest) =>
      invoke<BreedingRecord>('create_breeding_record', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records', variables.pair_id] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-stats'] });
    },
  });
}

// 更新繁殖记录
export function useUpdateBreedingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBreedingRecordRequest) =>
      invoke<BreedingRecord>('update_breeding_record', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-stats'] });
    },
  });
}

// ============ 巢箱管理 Hooks ============

// 获取巢箱列表
export function useNestBoxes(status?: string) {
  return useQuery({
    queryKey: ['nest-boxes', status],
    queryFn: () => invoke<NestBoxDetail[]>('get_nest_boxes', { status }),
  });
}

// 分配巢箱
export function useAssignNestBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignNestBoxRequest) =>
      invoke<void>('assign_nest_box', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nest-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pairs'] });
    },
  });
}

// ============ 统计分析 Hooks ============

// 获取繁殖统计信息
export function useBreedingStats() {
  return useQuery({
    queryKey: ['breeding-stats'],
    queryFn: () => invoke<BreedingStats>('get_breeding_statistics'),
    refetchInterval: 60000, // 每分钟刷新一次
  });
}

// ============ 组合 Hooks ============

// 获取完整的繁殖管理数据
export function useBreedingManagementData(limit?: number, offset?: number, status?: string) {
  const pairsQuery = useBreedingPairs(limit, offset, status);
  const statsQuery = useBreedingStats();
  const nestBoxesQuery = useNestBoxes('available');

  return {
    pairs: pairsQuery.data || [],
    stats: statsQuery.data,
    availableNestBoxes: nestBoxesQuery.data || [],
    isLoading: pairsQuery.isLoading || statsQuery.isLoading || nestBoxesQuery.isLoading,
    error: pairsQuery.error || statsQuery.error || nestBoxesQuery.error,
    refetch: () => {
      pairsQuery.refetch();
      statsQuery.refetch();
      nestBoxesQuery.refetch();
    },
  };
}

// 繁殖配对操作 Hook
export function useBreedingPairOperations() {
  const createPair = useCreateBreedingPair();
  const updatePair = useUpdateBreedingPair();
  const deletePair = useDeleteBreedingPair();
  const assignNestBox = useAssignNestBox();

  return {
    createPair,
    updatePair,
    deletePair,
    assignNestBox,
    isCreating: createPair.isPending,
    isUpdating: updatePair.isPending,
    isDeleting: deletePair.isPending,
    isAssigning: assignNestBox.isPending,
  };
}

// 繁殖记录操作 Hook
export function useBreedingRecordOperations() {
  const createRecord = useCreateBreedingRecord();
  const updateRecord = useUpdateBreedingRecord();

  return {
    createRecord,
    updateRecord,
    isCreating: createRecord.isPending,
    isUpdating: updateRecord.isPending,
  };
}

// 搜索 Hook
export function useBreedingSearch() {
  const queryClient = useQueryClient();

  const searchPairs = (query: string) => {
    return queryClient.fetchQuery({
      queryKey: ['search-breeding-pairs', query],
      queryFn: () => invoke<BreedingPairDetail[]>('search_breeding_pairs', { query }),
    });
  };

  return {
    searchPairs,
  };
}

// ============ 工具函数 ============

// 格式化日期
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN');
}

// 计算百分比显示
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// 获取状态颜色
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'separated':
      return 'text-yellow-600 bg-yellow-100';
    case 'completed':
      return 'text-gray-600 bg-gray-100';
    case 'available':
      return 'text-green-600 bg-green-100';
    case 'occupied':
      return 'text-blue-600 bg-blue-100';
    case 'maintenance':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// 获取性别显示文本
export function getSexText(sex: number): string {
  switch (sex) {
    case 0:
      return '雄';
    case 1:
      return '雌';
    case 2:
      return '未知';
    default:
      return '未知';
  }
}

// 获取状态显示文本
export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return '活跃';
    case 'separated':
      return '分离';
    case 'completed':
      return '完成';
    case 'available':
      return '可用';
    case 'occupied':
      return '占用';
    case 'maintenance':
      return '维护';
    default:
      return status;
  }
}

// 验证配对日期
export function validatePairDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date <= now && !isNaN(date.getTime());
}

// 验证蛋数量
export function validateEggCount(count: number): boolean {
  return count >= 0 && count <= 4; // 鸽子通常产1-4枚蛋
}

// 验证出孵数量
export function validateHatchedCount(hatched: number, eggs: number): boolean {
  return hatched >= 0 && hatched <= eggs;
}

// 验证出飞数量
export function validateFledgedCount(fledged: number, hatched: number): boolean {
  return fledged >= 0 && fledged <= hatched;
}