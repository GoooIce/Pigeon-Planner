import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// Simplified Types for Demo
export interface SimpleHealthCheck {
  id?: number;
  pigeon_id: number;
  check_date: string;
  weight?: number;
  temperature?: number;
  condition: string;
  notes?: string;
  examiner?: string;
  created_at?: string;
}

export interface SimpleHealthCheckInput {
  pigeon_id: number;
  check_date: string;
  weight?: number;
  temperature?: number;
  condition: string;
  notes?: string;
  examiner?: string;
}

export interface SimpleHealthSummary {
  total_pigeons: number;
  healthy_pigeons: number;
  total_vaccinations: number;
  recent_health_checks: number;
}

// Simplified Health Check Hooks
export const useSimpleHealthChecks = (
  pigeonId: number,
  options?: Omit<UseQueryOptions<SimpleHealthCheck[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['simple-health-checks', pigeonId],
    queryFn: () => invoke('get_simple_health_checks', { pigeonId }),
    enabled: !!pigeonId,
    ...options,
  });
};

export const useCreateSimpleHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (check: SimpleHealthCheckInput) =>
      invoke('create_simple_health_check', { checkInput: check }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['simple-health-checks', variables.pigeon_id] });
      queryClient.invalidateQueries({ queryKey: ['simple-health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to create health check:', error);
    },
  });
};

export const useDeleteSimpleHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invoke('delete_simple_health_check', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-health-checks'] });
      queryClient.invalidateQueries({ queryKey: ['simple-health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to delete health check:', error);
    },
  });
};

export const useSimpleHealthSummary = (
  options?: Omit<UseQueryOptions<SimpleHealthSummary, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['simple-health-summary'],
    queryFn: () => invoke('get_simple_health_summary'),
    ...options,
  });
};

// Utility Functions
export const getHealthConditionColor = (condition: string): string => {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return 'text-green-600 bg-green-50';
    case 'good':
      return 'text-blue-600 bg-blue-50';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const formatWeight = (weight?: number): string => {
  if (!weight) return '-';
  return `${weight.toFixed(1)} g`;
};

export const formatTemperature = (temp?: number): string => {
  if (!temp) return '-';
  return `${temp.toFixed(1)}°C`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};