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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  Plus,
  Users,
  ArrowLeft,
  User,
  Calendar,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'

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

interface Pigeon {
  id: number
  ring_number: string
  year: number
  name?: string
  color?: string
  sex: number
  strain?: string
  loft?: string
  status: number
}

interface RaceParticipant {
  id?: number
  race_id: number
  pigeon_id: number
  basket_number?: string
  registration_time?: string
  status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

interface RaceParticipantsProps {
  race: Race
  onBack: () => void
}

export const RaceParticipants: React.FC<RaceParticipantsProps> = ({
  race,
  onBack,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPigeons, setSelectedPigeons] = useState<number[]>([])

  // 模拟数据 - 在实际应用中，这些会从API获取
  const [participants, setParticipants] = useState<RaceParticipant[]>([
    // 模拟一些已参赛的鸽子
  ])

  const [availablePigeons] = useState<Pigeon[]>([
    // 模拟可用的鸽子列表
    {
      id: 1,
      ring_number: 'CHN-2024-001',
      year: 2024,
      name: '闪电',
      color: '灰色',
      sex: 1, // 雄性
      strain: '李种',
      loft: '主棚',
      status: 1, // 活跃
    },
    {
      id: 2,
      ring_number: 'CHN-2024-002',
      year: 2024,
      name: '风暴',
      color: '雨点',
      sex: 2, // 雌性
      strain: '詹森',
      loft: '主棚',
      status: 1,
    },
    {
      id: 3,
      ring_number: 'CHN-2023-015',
      year: 2023,
      name: '雄鹰',
      color: '绛色',
      sex: 1,
      strain: '杨阿腾',
      loft: '分棚',
      status: 1,
    },
  ])

  // 过滤可用的鸽子
  const filteredPigeons = availablePigeons.filter(pigeon => {
    const matchesSearch =
      pigeon.ring_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.strain?.toLowerCase().includes(searchTerm.toLowerCase())

    // 检查是否已参赛
    const isAlreadyParticipant = participants.some(p => p.pigeon_id === pigeon.id)

    return matchesSearch && !isAlreadyParticipant && pigeon.status === 1
  })

  // 处理鸽子选择
  const handlePigeonSelection = (pigeonId: number, checked: boolean) => {
    if (checked) {
      setSelectedPigeons(prev => [...prev, pigeonId])
    } else {
      setSelectedPigeons(prev => prev.filter(id => id !== pigeonId))
    }
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPigeons(filteredPigeons.map(p => p.id))
    } else {
      setSelectedPigeons([])
    }
  }

  // 注册鸽子参赛
  const handleRegisterPigeons = () => {
    if (selectedPigeons.length === 0) {
      toast.error('请选择要注册的鸽子')
      return
    }

    // TODO: 调用实际的API
    const newParticipants: RaceParticipant[] = selectedPigeons.map(pigeonId => ({
      race_id: race.id!,
      pigeon_id: pigeonId,
      basket_number: undefined,
      registration_time: new Date().toISOString(),
      status: 'registered',
      notes: '',
    }))

    setParticipants(prev => [...prev, ...newParticipants])
    setSelectedPigeons([])
    setIsAddDialogOpen(false)
    toast.success(`成功注册 ${selectedPigeons.length} 只鸽子参赛`)
  }

  // 移除参赛者
  const handleRemoveParticipant = (participantId: number) => {
    if (confirm('确定要移除这只参赛鸽子吗？')) {
      setParticipants(prev => prev.filter(p => p.id !== participantId))
      toast.success('参赛鸽子已移除')
    }
  }

  // 格式化性别
  const formatSex = (sex: number): string => {
    switch (sex) {
      case 1: return '雄'
      case 2: return '雌'
      default: return '未知'
    }
  }

  // 格式化日期
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
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

  return (
    <div className="space-y-6">
      {/* 返回按钮和比赛信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{race.race_name}</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{race.race_date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{race.release_point || '未设置'}</span>
              </div>
              <Badge variant="outline">
                {formatRaceCategory(race.category)}
              </Badge>
              <span>{race.distance_km} 公里</span>
            </div>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加参赛者
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加参赛鸽子</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* 搜索框 */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索足环号、名字或品种..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 全选 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedPigeons.length === filteredPigeons.length && filteredPigeons.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">全选 ({filteredPigeons.length} 只可用)</Label>
              </div>

              {/* 鸽子列表 */}
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">选择</TableHead>
                      <TableHead>足环号</TableHead>
                      <TableHead>名字</TableHead>
                      <TableHead>年份</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead>品种</TableHead>
                      <TableHead>鸽舍</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPigeons.map((pigeon) => (
                      <TableRow key={pigeon.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPigeons.includes(pigeon.id)}
                            onCheckedChange={(checked) => handlePigeonSelection(pigeon.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{pigeon.ring_number}</TableCell>
                        <TableCell>{pigeon.name || '-'}</TableCell>
                        <TableCell>{pigeon.year}</TableCell>
                        <TableCell>{formatSex(pigeon.sex)}</TableCell>
                        <TableCell>{pigeon.strain || '-'}</TableCell>
                        <TableCell>{pigeon.loft || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPigeons.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          {searchTerm ? '没有找到匹配的鸽子' : '没有可用的鸽子'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleRegisterPigeons}
                  disabled={selectedPigeons.length === 0}
                >
                  注册参赛 ({selectedPigeons.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 参赛者列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>参赛者列表 ({participants.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              还没有注册任何参赛鸽子
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>足环号</TableHead>
                  <TableHead>名字</TableHead>
                  <TableHead>鸽数编号</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => {
                  // 找到对应的鸽子信息
                  const pigeon = availablePigeons.find(p => p.id === participant.pigeon_id)
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{pigeon?.ring_number || '未知'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{pigeon?.name || '-'}</TableCell>
                      <TableCell>{participant.basket_number || '-'}</TableCell>
                      <TableCell>{formatDate(participant.registration_time)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          已注册
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveParticipant(participant.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          移除
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}