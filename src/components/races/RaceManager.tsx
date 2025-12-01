import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, Target, Plus } from 'lucide-react'
import { toast } from 'sonner'

// 导入子组件（稍后创建）
import { RaceList } from './RaceList'
import { RaceForm } from './RaceForm'
import { RaceParticipants } from './RaceParticipants'
import { RaceResults } from './RaceResults'

// 导入 hooks
import { useRaceManagement, formatRaceStatus, formatRaceCategory } from '@/hooks/useRace'

interface Race {
  id?: number
  race_name: string
  race_date: string
  distance_km: number
  release_point?: string
  release_time?: string
  weather_condition?: string
  wind_speed?: number
  wind_direction?: string
  temperature?: number
  category: string
  status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

const RaceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 使用比赛管理 hooks
  const {
    allRaces,
    createRace,
    updateRace,
    deleteRace,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRaceManagement()

  const handleCreateRace = (raceData: Partial<Race>) => {
    createRace.mutate(raceData as any, {
      onSuccess: () => {
        setIsFormOpen(false)
        toast.success('比赛创建成功')
      },
      onError: (error: any) => {
        toast.error('创建比赛失败: ' + error.message)
      }
    })
  }

  const handleUpdateRace = (raceData: Partial<Race>) => {
    if (!selectedRace?.id) return

    updateRace.mutate({
      id: selectedRace.id,
      updateData: raceData as any
    }, {
      onSuccess: () => {
        setSelectedRace(null)
        setIsFormOpen(false)
        toast.success('比赛更新成功')
      },
      onError: (error: any) => {
        toast.error('更新比赛失败: ' + error.message)
      }
    })
  }

  const handleDeleteRace = (raceId: number) => {
    if (confirm('确定要删除这个比赛吗？此操作不可撤销。')) {
      deleteRace.mutate(raceId, {
        onSuccess: () => {
          toast.success('比赛删除成功')
        },
        onError: (error: any) => {
          toast.error('删除比赛失败: ' + error.message)
        }
      })
    }
  }

  const handleEditRace = (race: Race) => {
    setSelectedRace(race)
    setIsFormOpen(true)
    setActiveTab('form')
  }

  const handleViewParticipants = (race: Race) => {
    setSelectedRace(race)
    setActiveTab('participants')
  }

  const handleViewResults = (race: Race) => {
    setSelectedRace(race)
    setActiveTab('results')
  }

  const handleFormSubmit = (raceData: Partial<Race>) => {
    if (selectedRace) {
      handleUpdateRace(raceData)
    } else {
      handleCreateRace(raceData)
    }
  }

  const handleFormCancel = () => {
    setSelectedRace(null)
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            比赛管理
          </h1>
          <p className="text-muted-foreground">管理赛鸽比赛、参赛者和成绩</p>
        </div>
        <Button
          onClick={() => {
            setSelectedRace(null)
            setIsFormOpen(true)
            setActiveTab('form')
          }}
          disabled={isCreating}
        >
          <Plus className="mr-2 h-4 w-4" />
          创建比赛
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总比赛数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allRaces.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              已创建的比赛
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">计划中</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allRaces.data?.filter(r => r.status === 'scheduled').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              计划中的比赛
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {allRaces.data?.filter(r => r.status === 'in_progress').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              正在进行的比赛
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allRaces.data?.filter(r => r.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              已完成的比赛
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">比赛列表</TabsTrigger>
          <TabsTrigger value="form" disabled={!isFormOpen}>
            {selectedRace ? '编辑比赛' : '创建比赛'}
          </TabsTrigger>
          <TabsTrigger value="participants" disabled={!selectedRace}>
            参赛管理
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!selectedRace}>
            成绩录入
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <RaceList
            onEditRace={handleEditRace}
            onDeleteRace={handleDeleteRace}
            onViewParticipants={handleViewParticipants}
            onViewResults={handleViewResults}
            isLoading={allRaces.isLoading}
            races={allRaces.data || []}
          />
        </TabsContent>

        <TabsContent value="form" className="mt-6">
          {isFormOpen && (
            <RaceForm
              race={selectedRace}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isCreating || isUpdating}
            />
          )}
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          {selectedRace && (
            <RaceParticipants
              race={selectedRace}
              onBack={() => setActiveTab('list')}
            />
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {selectedRace && (
            <RaceResults
              race={selectedRace}
              onBack={() => setActiveTab('list')}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { RaceManager }