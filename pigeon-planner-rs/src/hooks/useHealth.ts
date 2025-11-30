import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';

// Types
export interface HealthCheck {
  id?: number;
  pigeon_id: number;
  check_date: string;
  weight?: number;
  temperature?: number;
  condition: string;
  respiratory_rate?: number;
  heart_rate?: number;
  feathers_condition?: string;
  eyes_condition?: string;
  nose_condition?: string;
  mouth_condition?: string;
  crop_condition?: string;
  vent_condition?: string;
  feet_condition?: string;
  notes?: string;
  examiner?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HealthCheckInput {
  pigeon_id: number;
  check_date: string;
  weight?: number;
  temperature?: number;
  condition: string;
  respiratory_rate?: number;
  heart_rate?: number;
  feathers_condition?: string;
  eyes_condition?: string;
  nose_condition?: string;
  mouth_condition?: string;
  crop_condition?: string;
  vent_condition?: string;
  feet_condition?: string;
  notes?: string;
  examiner?: string;
}

export interface HealthCheckUpdate {
  id: number;
  check_date?: string;
  weight?: number;
  temperature?: number;
  condition?: string;
  respiratory_rate?: number;
  heart_rate?: number;
  feathers_condition?: string;
  eyes_condition?: string;
  nose_condition?: string;
  mouth_condition?: string;
  crop_condition?: string;
  vent_condition?: string;
  feet_condition?: string;
  notes?: string;
  examiner?: string;
}

export interface Vaccination {
  id?: number;
  pigeon_id: number;
  vaccine_type_id: number;
  vaccination_date: string;
  next_due_date?: string;
  batch_number?: string;
  manufacturer?: string;
  veterinarian?: string;
  dosage?: string;
  administration_route?: string;
  injection_site?: string;
  adverse_reactions?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VaccinationInput {
  pigeon_id: number;
  vaccine_type_id: number;
  vaccination_date: string;
  next_due_date?: string;
  batch_number?: string;
  manufacturer?: string;
  veterinarian?: string;
  dosage?: string;
  administration_route?: string;
  injection_site?: string;
  adverse_reactions?: string;
  notes?: string;
}

export interface Treatment {
  id?: number;
  pigeon_id: number;
  disease_type_id?: number;
  medication_type_id?: number;
  diagnosis_date: string;
  start_date: string;
  end_date?: string;
  status: string;
  symptoms?: string;
  diagnosis?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  administration_route?: string;
  duration_days?: number;
  response_to_treatment?: string;
  side_effects?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TreatmentInput {
  pigeon_id: number;
  disease_type_id?: number;
  medication_type_id?: number;
  diagnosis_date: string;
  start_date: string;
  end_date?: string;
  status: string;
  symptoms?: string;
  diagnosis?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  administration_route?: string;
  duration_days?: number;
  response_to_treatment?: string;
  side_effects?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
}

export interface HealthStatistics {
  pigeon_id: number;
  band_number: string;
  pigeon_name?: string;
  total_health_checks: number;
  last_check_date?: string;
  avg_weight?: number;
  total_vaccinations: number;
  last_vaccination_date?: string;
  total_treatments: number;
  ongoing_treatments: number;
  pending_reminders: number;
}

export interface VaccinationSchedule {
  pigeon_id: number;
  band_number: string;
  pigeon_name?: string;
  vaccine_name: string;
  vaccination_date: string;
  next_due_date: string;
  status: string;
  days_until_due: number;
}

export interface TreatmentHistory {
  pigeon_id: number;
  band_number: string;
  pigeon_name?: string;
  disease_name?: string;
  medication_name?: string;
  diagnosis_date: string;
  start_date: string;
  end_date?: string;
  status: string;
  treatment_duration_days: number;
}

export interface HealthSummary {
  total_pigeons: number;
  healthy_pigeons: number;
  sick_pigeons: number;
  vaccinations_due_this_week: number;
  overdue_vaccinations: number;
  ongoing_treatments: number;
  pending_reminders: number;
  recent_health_checks: number;
}

export interface VaccineType {
  id?: number;
  name: string;
  description?: string;
  recommended_age_days?: number;
  frequency_days?: number;
}

export interface DiseaseType {
  id?: number;
  name: string;
  description?: string;
  symptoms?: string;
  treatment_recommendations?: string;
}

export interface MedicationType {
  id?: number;
  name: string;
  description?: string;
  dosage_form?: string;
  standard_dosage?: string;
  contraindications?: string;
}

// Health Check Hooks
export const useHealthChecks = (
  pigeonId: number,
  options?: Omit<UseQueryOptions<HealthCheck[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['health-checks', pigeonId],
    queryFn: () => invoke('get_health_checks', { pigeonId, limit: 100, offset: 0 }),
    enabled: !!pigeonId,
    ...options,
  });
};

export const useHealthCheckById = (
  id: number,
  options?: Omit<UseQueryOptions<HealthCheck | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['health-check', id],
    queryFn: () => invoke('get_health_check_by_id', { id }),
    enabled: !!id,
    ...options,
  });
};

export const useCreateHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (check: HealthCheckInput) =>
      invoke('create_health_check', { checkInput: check }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['health-checks', variables.pigeon_id] });
      queryClient.invalidateQueries({ queryKey: ['health-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to create health check:', error);
    },
  });
};

export const useUpdateHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: HealthCheckUpdate) =>
      invoke('update_health_check', { update }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['health-check', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['health-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to update health check:', error);
    },
  });
};

export const useDeleteHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invoke('delete_health_check', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-checks'] });
      queryClient.invalidateQueries({ queryKey: ['health-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to delete health check:', error);
    },
  });
};

// Vaccination Hooks
export const useVaccinations = (
  pigeonId: number,
  options?: Omit<UseQueryOptions<Vaccination[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['vaccinations', pigeonId],
    queryFn: () => invoke('get_vaccinations', { pigeonId, limit: 100, offset: 0 }),
    enabled: !!pigeonId,
    ...options,
  });
};

export const useVaccinationSchedule = (
  pigeonId?: number,
  options?: Omit<UseQueryOptions<VaccinationSchedule[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['vaccination-schedule', pigeonId],
    queryFn: () => invoke('get_vaccination_schedule', { pigeonId: pigeonId || null }),
    ...options,
  });
};

export const useCreateVaccination = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vaccination: VaccinationInput) =>
      invoke('create_vaccination', { vaccinationInput: vaccination }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', variables.pigeon_id] });
      queryClient.invalidateQueries({ queryKey: ['vaccination-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['health-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to create vaccination:', error);
    },
  });
};

// Treatment Hooks
export const useTreatments = (
  pigeonId: number,
  status?: string,
  options?: Omit<UseQueryOptions<Treatment[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['treatments', pigeonId, status],
    queryFn: () => invoke('get_treatments', { pigeonId, status: status || null, limit: 100, offset: 0 }),
    enabled: !!pigeonId,
    ...options,
  });
};

export const useTreatmentHistory = (
  pigeonId: number,
  options?: Omit<UseQueryOptions<TreatmentHistory[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['treatment-history', pigeonId],
    queryFn: () => invoke('get_treatment_history', { pigeonId }),
    enabled: !!pigeonId,
    ...options,
  });
};

export const useCreateTreatment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (treatment: TreatmentInput) =>
      invoke('create_treatment', { treatmentInput: treatment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treatments', variables.pigeon_id] });
      queryClient.invalidateQueries({ queryKey: ['treatment-history', variables.pigeon_id] });
      queryClient.invalidateQueries({ queryKey: ['health-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['health-summary'] });
    },
    onError: (error) => {
      console.error('Failed to create treatment:', error);
    },
  });
};

// Statistics Hooks
export const useHealthStatistics = (
  pigeonId?: number,
  options?: Omit<UseQueryOptions<HealthStatistics[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['health-statistics', pigeonId],
    queryFn: () => invoke('get_health_statistics', { pigeonId: pigeonId || null }),
    ...options,
  });
};

export const useHealthSummary = (
  options?: Omit<UseQueryOptions<HealthSummary, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['health-summary'],
    queryFn: () => invoke('get_health_summary'),
    ...options,
  });
};

// Reference Data Hooks
export const useVaccineTypes = (
  options?: Omit<UseQueryOptions<VaccineType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['vaccine-types'],
    queryFn: () => invoke('get_vaccine_types'),
    ...options,
  });
};

export const useDiseaseTypes = (
  options?: Omit<UseQueryOptions<DiseaseType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['disease-types'],
    queryFn: () => invoke('get_disease_types'),
    ...options,
  });
};

export const useMedicationTypes = (
  options?: Omit<UseQueryOptions<MedicationType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['medication-types'],
    queryFn: () => invoke('get_medication_types'),
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

export const getTreatmentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return 'text-blue-600 bg-blue-50';
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'discontinued':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getVaccinationStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'overdue':
      return 'text-red-600 bg-red-50';
    case 'due_soon':
      return 'text-yellow-600 bg-yellow-50';
    case 'scheduled':
      return 'text-green-600 bg-green-50';
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