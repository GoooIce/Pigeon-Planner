import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// 类型定义
export interface Race {
  id?: number;
  race_name: string;
  race_date: string; // YYYY-MM-DD
  distance_km: number;
  release_point?: string;
  release_time?: string;
  weather_condition?: string;
  wind_speed?: number;
  wind_direction?: string;
  temperature?: number;
  category: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RaceParticipant {
  id?: number;
  race_id: number;
  pigeon_id: number;
  basket_number?: string;
  registration_time?: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RaceResult {
  id?: number;
  race_id: number;
  pigeon_id: number;
  arrival_time: string;
  arrival_speed?: number;
  flight_duration_seconds?: number;
  distance_flown_km?: number;
  rank_position?: number;
  points?: number;
  prize_won?: number;
  disqualification_reason?: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RaceStatistics {
  race_id: number;
  race_name: string;
  race_date: string;
  distance_km: number;
  category: string;
  race_status: string;
  total_participants: number;
  total_finishers: number;
  finished_count: number;
  disqualified_count: number;
  lost_count: number;
  completion_rate_percent: number;
  average_speed_mps?: number;
  average_flight_duration_seconds?: number;
  first_arrival_time?: string;
  last_arrival_time?: string;
  time_span_seconds?: number;
}

// 请求 DTO
export interface CreateRaceRequest {
  race_name: string;
  race_date: string;
  distance_km: number;
  release_point?: string;
  release_time?: string;
  weather_condition?: string;
  wind_speed?: number;
  wind_direction?: string;
  temperature?: number;
  category: string;
  notes?: string;
}

export interface UpdateRaceRequest {
  race_name?: string;
  race_date?: string;
  distance_km?: number;
  release_point?: string;
  release_time?: string;
  weather_condition?: string;
  wind_speed?: number;
  wind_direction?: string;
  temperature?: number;
  category?: string;
  status?: string;
  notes?: string;
}

export interface DeleteRaceRequest {
  race_id: number;
}

export interface RaceRegistrationRequest {
  race_id: number;
  pigeon_ids: number[];
  notes?: string;
}

export interface RaceResultBatch {
  race_id: number;
  results: RaceResultEntry[];
}

export interface RaceResultEntry {
  pigeon_id: number;
  arrival_time: string;
  rank_position?: number;
  points?: number;
  prize_won?: number;
  disqualification_reason?: string;
  status: string;
  notes?: string;
}

export interface RaceSearchParams {
  query?: string;
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// API Keys
const QUERY_KEYS = {
  allRaces: (params?: RaceSearchParams) =>
    ['races', params] as const,
  raceById: (id: number) => ['race', id] as const,
  raceParticipants: (raceId: number) =>
    ['race-participants', raceId] as const,
  raceResults: (raceId: number) =>
    ['race-results', raceId] as const,
  raceStatistics: (raceId: number) =>
    ['race-statistics', raceId] as const,
  raceHistory: (pigeonId: number, limit?: number, offset?: number) =>
    ['race-history', pigeonId, limit, offset] as const,
  searchRaces: (params: RaceSearchParams) =>
    ['races', 'search', params] as const,
};

// 1. 获取所有比赛
export function useAllRaces(params?: RaceSearchParams) {
  return useQuery({
    queryKey: QUERY_KEYS.allRaces(params),
    queryFn: async (): Promise<Race[]> => {
      return await invoke('get_all_races', { params: params || {} });
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 2. 根据ID获取单个比赛
export function useRaceById(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.raceById(id),
    queryFn: async (): Promise<Race> => {
      return await invoke('get_race_by_id', { raceId: id });
    },
    enabled: id > 0,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 3. 创建比赛
export function useCreateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRaceRequest): Promise<Race> => {
      return await invoke('create_race', { raceData: data });
    },
    onSuccess: () => {
      // 使相关查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// 4. 更新比赛
export function useUpdateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; updateData: UpdateRaceRequest }): Promise<Race> => {
      return await invoke('update_race', {
        raceId: data.id,
        updateData: data.updateData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raceById(data.id) });
      }
    },
  });
}

// 5. 删除比赛
export function useDeleteRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: number): Promise<boolean> => {
      return await invoke('delete_race', { raceId });
    },
    onSuccess: () => {
      // 使相关查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// 6. 获取比赛参与者
export function useRaceParticipants(raceId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.raceParticipants(raceId),
    queryFn: async (): Promise<RaceParticipant[]> => {
      return await invoke('get_race_participants', { raceId });
    },
    enabled: raceId > 0,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 7. 获取比赛结果
export function useRaceResults(raceId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.raceResults(raceId),
    queryFn: async (): Promise<RaceResult[]> => {
      return await invoke('get_race_results', { raceId });
    },
    enabled: raceId > 0,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 8. 获取比赛统计
export function useRaceStatistics(raceId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.raceStatistics(raceId),
    queryFn: async (): Promise<RaceStatistics> => {
      return await invoke('get_race_statistics', { raceId });
    },
    enabled: raceId > 0,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

// 9. 获取鸽子比赛历史
export function useRaceHistory(pigeonId: number, limit?: number, offset?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.raceHistory(pigeonId, limit, offset),
    queryFn: async (): Promise<any[]> => {
      return await invoke('get_pigeon_race_history', {
        pigeonId,
        limit: limit || 50,
        offset: offset || 0
      });
    },
    enabled: pigeonId > 0,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

// 10. 搜索比赛
export function useSearchRaces(searchParams: RaceSearchParams) {
  return useQuery({
    queryKey: QUERY_KEYS.searchRaces(searchParams),
    queryFn: async (): Promise<Race[]> => {
      return await invoke('search_races', { params: searchParams });
    },
    enabled: !!searchParams.query || !!searchParams.category || !!searchParams.status,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 11. 注册鸽子参赛
export function useRegisterPigeons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RaceRegistrationRequest): Promise<boolean> => {
      return await invoke('register_pigeons_for_race', {
        raceId: data.race_id,
        pigeonIds: data.pigeon_ids,
        notes: data.notes
      });
    },
    onSuccess: () => {
      // 使相关查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['race-participants'] });
      if (data.race_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raceById(data.race_id) });
      }
    },
  });
}

// 12. 批量录入比赛结果
export function useBatchRaceResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RaceResultBatch): Promise<boolean> => {
      return await invoke('batch_race_results', {
        raceId: data.race_id,
        results: data.results
      });
    },
    onSuccess: () => {
      // 使相关查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['race-results'] });
      if (data.race_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raceById(data.race_id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raceStatistics(data.race_id) });
      }
    },
  });
}

// 组合Hook：比赛完整信息
export function useCompleteRaceInfo(raceId: number) {
  const race = useRaceById(raceId);
  const participants = useRaceParticipants(raceId);
  const results = useRaceResults(raceId);
  const statistics = useRaceStatistics(raceId);

  return {
    race,
    participants,
    results,
    statistics,
    isLoading: race.isLoading || participants.isLoading || results.isLoading || statistics.isLoading,
    error: race.error || participants.error || results.error || statistics.error,
  };
}

// 组合Hook：比赛管理（完整功能）
export function useRaceManagement() {
  const allRaces = useAllRaces();
  const createRace = useCreateRace();
  const updateRace = useUpdateRace();
  const deleteRace = useDeleteRace();
  const registerPigeons = useRegisterPigeons();
  const batchRaceResults = useBatchRaceResults();

  return {
    allRaces,
    createRace,
    updateRace,
    deleteRace,
    registerPigeons,
    batchRaceResults,
    isCreating: createRace.isPending,
    isUpdating: updateRace.isPending,
    isDeleting: deleteRace.isPending,
    isRegistering: registerPigeons.isPending,
    isBatchRecording: batchRaceResults.isPending,
  };
}

// 工具函数：格式化比赛状态
export function formatRaceStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'scheduled': { text: '计划中', color: 'text-blue-600' },
    'registration': { text: '报名中', color: 'text-yellow-600' },
    'in_progress': { text: '进行中', color: 'text-orange-600' },
    'completed': { text: '已完成', color: 'text-green-600' },
    'cancelled': { text: '已取消', color: 'text-gray-600' },
  };
  return statusMap[status] || { text: status, color: 'text-gray-600' };
}

// 工具函数：格式化比赛类别
export function formatRaceCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'short': '短距离',
    'middle': '中距离',
    'long': '长距离',
    'young_bird': '幼鸽赛',
    'old_bird': '老鸽赛',
    'special': '特殊比赛',
  };
  return categoryMap[category] || category;
}

// 工具函数：计算飞行速度（米/秒）
export function calculateSpeed(
  distanceKm: number,
  flightDurationSeconds?: number
): number | null {
  if (!flightDurationSeconds || flightDurationSeconds <= 0) return null;
  return (distanceKm * 1000) / flightDurationSeconds;
}

// 工具函数：格式化速度显示
export function formatSpeed(speedMps: number): string {
  if (!speedMps || speedMps <= 0) return '0 m/s';

  const speedKmh = speedMps * 3.6; // 转换为公里/小时
  return `${speedKmh.toFixed(1)} km/h`;
}

// 工具函数：格式化时间
export function formatTime(timeString: string): string {
  if (!timeString) return '';

  try {
    const date = new Date(timeString);
    return date.toLocaleString();
  } catch (error) {
    return timeString;
  }
}

// 工具函数：格式化日期
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    return dateString;
  }
}

// 工具函数：验证比赛数据
export function validateRaceData(data: CreateRaceRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.race_name?.trim()) {
    errors.push('比赛名称不能为空');
  }

  if (!data.race_date?.trim()) {
    errors.push('比赛日期不能为空');
  }

  if (data.distance_km <= 0) {
    errors.push('比赛距离必须大于0');
  }

  if (!data.category?.trim()) {
    errors.push('比赛类别不能为空');
  }

  // 验证日期格式
  if (data.race_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.race_date)) {
      errors.push('日期格式不正确，应为 YYYY-MM-DD');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 工具函数：生成比赛查询键
export function getRaceCacheKey(category?: string, status?: string, search?: string): string[] {
  const key = ['races'];
  if (category) key.push(`category:${category}`);
  if (status) key.push(`status:${status}`);
  if (search) key.push(`search:${search}`);
  return key;
}