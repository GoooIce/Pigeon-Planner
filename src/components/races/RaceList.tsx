import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Edit,
  Trash2,
  Users,
  Target,
  Calendar,
  MapPin,
  Eye
} from 'lucide-react'

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

interface RaceListProps {
  races: Race[]
  isLoading: boolean
  onEditRace: (race: Race) => void
  onDeleteRace: (raceId: number) => void
  onViewParticipants: (race: Race) => void
  onViewResults: (race: Race) => void
}

export const RaceList: React.FC<RaceListProps> = ({
  races,
  isLoading,
  onEditRace,
  onDeleteRace,
  onViewParticipants,
  onViewResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 过滤比赛
  const filteredRaces = races.filter(race => {
    const matchesSearch =
      race.race_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      race.release_point?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      race.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || race.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || race.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // 格式化比赛状态
  const formatRaceStatus = (status: string): { text: string; color: string } => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'scheduled': { text: '计划中', color: 'bg-blue-100 text-blue-800' },
      'registration': { text: '报名中', color: 'bg-yellow-100 text-yellow-800' },
      'in_progress': { text: '进行中', color: 'bg-orange-100 text-orange-800' },
      'completed': { text: '已完成', color: 'bg-green-100 text-green-800' },
      'cancelled': { text: '已取消', color: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  // 格式化比赛类别
  const formatRaceCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'short': '短距离',
      'middle': '中距离',
      'long': '长距离',
      'young_bird': '幼鸽赛',
      'old_bird': '老鸽赛',
      'special': '特殊比赛',
    }
    return categoryMap[category] || category
  }

  // 格式化日期
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  // 格式化距离
  const formatDistance = (distance: number): string => {
    return `${distance} 公里`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">加载比赛列表中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>比赛列表</CardTitle>

          {/* 搜索和过滤器 */}
          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索比赛名称、地点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* 状态过滤器 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="scheduled">计划中</SelectItem>
                <SelectItem value="registration">报名中</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>

            {/* 类别过滤器 */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                <SelectItem value="short">短距离</SelectItem>
                <SelectItem value="middle">中距离</SelectItem>
                <SelectItem value="long">长距离</SelectItem>
                <SelectItem value="young_bird">幼鸽赛</SelectItem>
                <SelectItem value="old_bird">老鸽赛</SelectItem>
                <SelectItem value="special">特殊比赛</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRaces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? '没有找到匹配的比赛'
              : '还没有创建任何比赛'
            }
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>比赛名称</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>距离</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>参赛数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRaces.map((race) => {
                const statusInfo = formatRaceStatus(race.status)
                return (
                  <TableRow key={race.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>{race.race_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(race.race_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span>{formatDistance(race.distance_km)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatRaceCategory(race.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{race.release_point || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>0</span> {/* TODO: 从 API 获取实际参赛数量 */}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewParticipants(race)}
                          title="查看参赛者"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewResults(race)}
                          title="查看成绩"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditRace(race)}
                          title="编辑比赛"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteRace(race.id!)}
                          title="删除比赛"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}