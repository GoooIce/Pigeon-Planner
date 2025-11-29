import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAllRaces, useCreateRace, useRaceById, useUpdateRace, useDeleteRace } from '@/hooks/useRace'

// Mock Tauri invoke function
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useRace hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('useAllRaces', () => {
    it('should successfully fetch races', async () => {
      const mockRaces = [
        {
          id: 1,
          race_name: '春季竞赛',
          race_date: '2024-03-15',
          distance_km: 300,
          category: 'middle',
          status: 'scheduled',
        },
      ]

      mockInvoke.mockResolvedValue(mockRaces)

      const { result } = renderHook(() => useAllRaces(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toEqual(mockRaces)
      })

      expect(mockInvoke).toHaveBeenCalledWith('get_all_races', { params: {} })
    })

    it('should handle error when fetching races', async () => {
      const error = new Error('Failed to fetch races')
      mockInvoke.mockRejectedValue(error)

      const { result } = renderHook(() => useAllRaces(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeTruthy()
      })
    })
  })

  describe('useRaceById', () => {
    it('should successfully fetch a race by id', async () => {
      const mockRace = {
        id: 1,
        race_name: '春季竞赛',
        race_date: '2024-03-15',
        distance_km: 300,
        category: 'middle',
        status: 'scheduled',
      }

      mockInvoke.mockResolvedValue(mockRace)

      const { result } = renderHook(() => useRaceById(1), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toEqual(mockRace)
      })

      expect(mockInvoke).toHaveBeenCalledWith('get_race_by_id', { raceId: 1 })
    })

    it('should not fetch if id is 0', () => {
      renderHook(() => useRaceById(0), { wrapper })

      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('useCreateRace', () => {
    it('should successfully create a race', async () => {
      const newRace = {
        race_name: '新比赛',
        race_date: '2024-04-01',
        distance_km: 500,
        category: 'long',
        status: 'scheduled',
      }

      const createdRace = { id: 1, ...newRace }
      mockInvoke.mockResolvedValue(createdRace)

      const { result } = renderHook(() => useCreateRace(), { wrapper })

      result.current.mutate(newRace)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockInvoke).toHaveBeenCalledWith('create_race', { raceData: newRace })
    })
  })

  describe('useUpdateRace', () => {
    it('should successfully update a race', async () => {
      const updateData = {
        race_name: '更新的比赛',
        distance_km: 350,
      }

      mockInvoke.mockResolvedValue(true)

      const { result } = renderHook(() => useUpdateRace(), { wrapper })

      result.current.mutate({ id: 1, updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockInvoke).toHaveBeenCalledWith('update_race', {
        raceId: 1,
        updateData,
      })
    })
  })

  describe('useDeleteRace', () => {
    it('should successfully delete a race', async () => {
      mockInvoke.mockResolvedValue(true)

      const { result } = renderHook(() => useDeleteRace(), { wrapper })

      result.current.mutate(1)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockInvoke).toHaveBeenCalledWith('delete_race', { raceId: 1 })
    })
  })
})