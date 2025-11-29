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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Target,
  Users,
  Clock,
  Trophy,
  Edit,
  Save,
  X
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
}

interface RaceResult {
  id?: number
  race_id: number
  pigeon_id: number
  arrival_time: string
  arrival_speed?: number
  flight_duration_seconds?: number
  distance_flown_km?: number
  rank_position?: number
  points?: number
  prize_won?: number
  disqualification_reason?: string
  status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

interface RaceResultsProps {
  race: Race
  onBack: () => void
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  race,
  onBack,
}) => {
  const [editingResult, setEditingResult] = useState<RaceResult | null>(null)
  const [formData, setFormData] = useState<Partial<RaceResult>>({})

  // 模拟数据 - 在实际应用中，这些会从API获取
  const [results, setResults] = useState<RaceResult[]>([
    // 模拟一些比赛结果
  ])

  const participants = [
    // 模拟参赛的鸽子
    {
      id: 1,
      ring_number: 'CHN-2024-001',
      year: 2024,
      name: '闪电',
      color: '灰色',
      sex: 1, // 雄性
      strain: '李种',
      loft: '主棚',
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
    },
  ]

  // 获取未录入成绩的参赛者
  const participantsWithoutResults = participants.filter(pigeon =>
    !results.some(result => result.pigeon_id === pigeon.id)
  )

  // 开始编辑结果
  const handleEditResult = (result?: RaceResult) => {
    if (result) {
      setEditingResult(result)
      setFormData(result)
    } else {
      setEditingResult(null)
      setFormData({
        race_id: race.id!,
        status: 'finished',
        arrival_time: new Date().toISOString().slice(0, 16), // 当前时间
      })
    }
  }

  // 保存结果
  const handleSaveResult = () => {
    if (!formData.pigeon_id || !formData.arrival_time) {
      toast.error('请选择鸽子并填写到达时间')
      return
    }

    // 计算速度等数据（示例逻辑）
    const releaseTime = new Date(race.release_time || `${race.race_date}T07:00:00`)
    const arrivalTime = new Date(formData.arrival_time)
    const flightDuration = (arrivalTime.getTime() - releaseTime.getTime()) / 1000 // 秒

    const calculatedSpeed = flightDuration > 0 ? (race.distance_km * 1000) / flightDuration : 0

    const resultData = {
      ...formData,
      flight_duration_seconds: flightDuration,
      arrival_speed: calculatedSpeed,
      distance_flown_km: race.distance_km,
    } as RaceResult

    if (editingResult?.id) {
      // 更新现有结果
      setResults(prev => prev.map(r =>
        r.id === editingResult.id ? resultData : r
      ))
      toast.success('比赛成绩更新成功')
    } else {
      // 添加新结果
      setResults(prev => [...prev, resultData])
      toast.success('比赛成绩录入成功')
    }

    handleEditResult(null)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    handleEditResult(null)
  }

  // 删除结果
  const handleDeleteResult = (resultId: number) => {
    if (confirm('确定要删除这个比赛成绩吗？')) {
      setResults(prev => prev.filter(r => r.id !== resultId))
      toast.success('比赛成绩已删除')
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

  // 格式化时间
  const formatTime = (timeString: string): string => {
    if (!timeString) return '-'
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  }

  // 格式化速度
  const formatSpeed = (speedMps?: number): string => {
    if (!speedMps) return '-'
    const kmh = speedMps * 3.6
    return `${kmh.toFixed(1)} km/h`
  }

  // 格式化飞行时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}小时${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }

  // 获取鸽子信息
  const getPigeonInfo = (pigeonId: number) => {
    return participants.find(p => p.id === pigeonId)
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
            <h2 className="text-2xl font-bold">比赛成绩录入</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{race.race_name}</span>
              <span>{race.race_date}</span>
              <span>{race.distance_km} 公里</span>
            </div>
          </div>
        </div>

        {participantsWithoutResults.length > 0 && (
          <Button onClick={() => handleEditResult()}>
            <Target className="mr-2 h-4 w-4" />
            录入成绩
          </Button>
        )}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{participants.length}</div>
                <div className="text-sm text-muted-foreground">参赛总数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-sm text-muted-foreground">已录成绩</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{participantsWithoutResults.length}</div>
                <div className="text-sm text-muted-foreground">待录入</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {results.filter(r => r.rank_position && r.rank_position <= 3).length}
                </div>
                <div className="text-sm text-muted-foreground">前3名</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 成绩录入表单 */}
      {editingResult !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingResult ? '编辑比赛成绩' : '录入比赛成绩'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>选择鸽子 *</Label>
                <Select
                  value={formData.pigeon_id?.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pigeon_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择参赛鸽子" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingResult ? participants : participantsWithoutResults).map(pigeon => (
                      <SelectItem key={pigeon.id} value={pigeon.id.toString()}>
                        {pigeon.ring_number} - {pigeon.name || '无名'} ({formatSex(pigeon.sex)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>到达时间 *</Label>
                <Input
                  type="datetime-local"
                  value={formData.arrival_time?.slice(0, 16) || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrival_time: e.target.value }))}
                />
              </div>

              <div>
                <Label>名次</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="可选"
                  value={formData.rank_position || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rank_position: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>

              <div>
                <Label>得分</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="可选"
                  value={formData.points || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    points: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                />
              </div>

              <div>
                <Label>奖金 (元)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="可选"
                  value={formData.prize_won || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    prize_won: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                />
              </div>

              <div>
                <Label>状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">正常完成</SelectItem>
                    <SelectItem value="disqualified">取消资格</SelectItem>
                    <SelectItem value="lost">迷失</SelectItem>
                    <SelectItem value="injured">受伤</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label>取消资格原因</Label>
                <Input
                  placeholder="如果取消资格，请说明原因"
                  value={formData.disqualification_reason || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, disqualification_reason: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label>备注</Label>
                <Textarea
                  rows={3}
                  placeholder="其他备注信息"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
              <Button onClick={handleSaveResult}>
                <Save className="mr-2 h-4 w-4" />
                保存成绩
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成绩列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>比赛成绩列表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              还没有录入任何比赛成绩
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名次</TableHead>
                  <TableHead>足环号</TableHead>
                  <TableHead>名字</TableHead>
                  <TableHead>到达时间</TableHead>
                  <TableHead>飞行时长</TableHead>
                  <TableHead>飞行速度</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .sort((a, b) => {
                    if (a.rank_position && b.rank_position) {
                      return a.rank_position - b.rank_position
                    }
                    if (a.rank_position) return -1
                    if (b.rank_position) return 1
                    return 0
                  })
                  .map((result) => {
                    const pigeon = getPigeonInfo(result.pigeon_id)
                    const statusInfo = {
                      'finished': { text: '正常完成', color: 'bg-green-100 text-green-800' },
                      'disqualified': { text: '取消资格', color: 'bg-red-100 text-red-800' },
                      'lost': { text: '迷失', color: 'bg-gray-100 text-gray-800' },
                      'injured': { text: '受伤', color: 'bg-yellow-100 text-yellow-800' },
                    }[result.status] || { text: result.status, color: 'bg-gray-100 text-gray-800' }

                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          {result.rank_position ? (
                            <div className="flex items-center space-x-2">
                              {result.rank_position <= 3 && (
                                <Trophy className={`h-4 w-4 ${
                                  result.rank_position === 1 ? 'text-yellow-500' :
                                  result.rank_position === 2 ? 'text-gray-400' :
                                  'text-orange-600'
                                }`} />
                              )}
                              <span className="font-bold">第 {result.rank_position} 名</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">{pigeon?.ring_number || '未知'}</TableCell>
                        <TableCell>{pigeon?.name || '-'}</TableCell>
                        <TableCell>{formatTime(result.arrival_time)}</TableCell>
                        <TableCell>{formatDuration(result.flight_duration_seconds)}</TableCell>
                        <TableCell>{formatSpeed(result.arrival_speed)}</TableCell>
                        <TableCell>{result.points || '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            {statusInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditResult(result)}
                          >
                            <Edit className="h-4 w-4" />
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