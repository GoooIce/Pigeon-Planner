import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// Types
export interface Pigeon {
  id: number;
  ring_number: string;
  year: number;
  name?: string;
  color?: string;
  sex: number;
  strain?: string;
  loft?: string;
  status: number;
  image_path?: string;
  sire_ring_number?: string;
  sire_year?: number;
  dam_ring_number?: string;
  dam_year?: number;
  extra_fields?: string;
  created_at: string;
  updated_at?: string;
}

export interface PigeonInput {
  ring_number: string;
  year: number;
  name?: string;
  color?: string;
  sex: number;
  strain?: string;
  loft?: string;
  status: number;
  image_path?: string;
  sire_ring_number?: string;
  sire_year?: number;
  dam_ring_number?: string;
  dam_year?: number;
  extra_fields?: string;
}

// Main hooks for pigeon management
export const usePigeons = (
  options?: Omit<UseQueryOptions<Pigeon[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['pigeons'],
    queryFn: () => invoke<Pigeon[]>('get_all_pigeons'),
    ...options,
  });
};

export const usePigeonById = (
  id: number,
  options?: Omit<UseQueryOptions<Pigeon | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['pigeon', id],
    queryFn: () => invoke<Pigeon | null>('get_pigeon_by_id', { id }),
    enabled: !!id,
    ...options,
  });
};

// Search hooks
export const useSearchPigeons = (
  params: {
    ring_number?: string;
    name?: string;
    strain?: string;
    loft?: string;
    sex?: number;
    status?: number;
    limit?: number;
    offset?: number;
  },
  options?: Omit<UseQueryOptions<Pigeon[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['search-pigeons', params],
    queryFn: () => invoke<Pigeon[]>('search_pigeons', { ...params }),
    ...options,
  });
};

// Utility functions
export const getSexText = (sex: number): string => {
  switch (sex) {
    case 0:
      return '雄';
    case 1:
      return '雌';
    default:
      return '未知';
  }
};

export const getStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return '正常';
    case 1:
      return '生病';
    case 2:
      return '治疗中';
    case 3:
      return '已退役';
    case 4:
      return '已死亡';
    case 5:
      return '已出售';
    default:
      return '未知';
  }
};

export const getStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return 'text-green-600 bg-green-50';
    case 1:
      return 'text-red-600 bg-red-50';
    case 2:
      return 'text-blue-600 bg-blue-50';
    case 3:
      return 'text-gray-600 bg-gray-50';
    case 4:
      return 'text-gray-800 bg-gray-100';
    case 5:
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const formatPigeonName = (pigeon: Pigeon): string => {
  if (pigeon.name) {
    return `${pigeon.name} (${pigeon.ring_number})`;
  }
  return pigeon.ring_number;
};

export const formatPigeonAge = (year: number): string => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return `${age}岁`;
};

export const getSexColor = (sex: number): string => {
  switch (sex) {
    case 0: // 雄
      return 'text-blue-600 bg-blue-50';
    case 1: // 雌
      return 'text-pink-600 bg-pink-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};