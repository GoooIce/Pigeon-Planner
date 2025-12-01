import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RaceForm } from '@/components/races/RaceForm'

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: (fn: any) => fn,
    formState: { errors: {} },
    reset: vi.fn(),
    control: {
      _fields: {},
    },
  }),
}))

// Mock zod resolver
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}))

describe('RaceForm', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Create mode', () => {
    it('should render form with empty fields', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={null}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={false}
        />,
        { wrapper }
      )

      expect(screen.getByText('创建新比赛')).toBeInTheDocument()
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // race_name
      expect(screen.getByText('创建比赛')).toBeInTheDocument()
    })

    it('should call onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={null}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={false}
        />,
        { wrapper }
      )

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('请输入比赛名称'), {
        target: { value: '测试比赛' },
      })
      fireEvent.change(screen.getByDisplayValue('100'), {
        target: { value: '300' },
      })

      // Submit form
      fireEvent.click(screen.getByText('创建比赛'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled()
      })
    })

    it('should call onCancel when cancel button is clicked', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={null}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={false}
        />,
        { wrapper }
      )

      fireEvent.click(screen.getByText('取消'))

      expect(onCancel).toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should disable submit button when loading', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={null}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={true}
        />,
        { wrapper }
      )

      expect(screen.getByText('保存中...')).toBeDisabled()
    })
  })

  describe('Edit mode', () => {
    const mockRace = {
      id: 1,
      race_name: '春季竞赛',
      race_date: '2024-03-15',
      distance_km: 300,
      category: 'middle',
      status: 'scheduled',
    }

    it('should render form with pre-filled data', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={mockRace}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={false}
        />,
        { wrapper }
      )

      expect(screen.getByText('编辑比赛')).toBeInTheDocument()
      expect(screen.getByDisplayValue('春季竞赛')).toBeInTheDocument()
      expect(screen.getByDisplayValue('300')).toBeInTheDocument()
      expect(screen.getByText('更新比赛')).toBeInTheDocument()
    })

    it('should call onSubmit with updated data', async () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <RaceForm
          race={mockRace}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={false}
        />,
        { wrapper }
      )

      // Update race name
      fireEvent.change(screen.getByDisplayValue('春季竞赛'), {
        target: { value: '更新的春季竞赛' },
      })

      // Submit form
      fireEvent.click(screen.getByText('更新比赛'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled()
      })
    })
  })
})