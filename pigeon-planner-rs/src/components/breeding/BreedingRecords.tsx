import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Egg,
  Baby,
  Bird,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useBreedingRecords,
  useBreedingRecordOperations,
  formatDate,
  validateEggCount,
  validateHatchedCount,
  validateFledgedCount,
} from '@/hooks/useBreeding'

interface BreedingRecordsProps {
  pairId: number
  pairInfo?: {
    sire_ring_number: string
    dam_ring_number: string
    sire_name?: string
    dam_name?: string
  }
  className?: string
}

export function BreedingRecords({ pairId, pairInfo, className }: BreedingRecordsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [formData, setFormData] = useState({
    clutch_number: '',
    egg_count: '2',
    first_egg_date: '',
    second_egg_date: '',
    hatched_count: '0',
    fledged_count: '0',
    first_hatch_date: '',
    second_hatch_date: '',
    notes: '',
  })

  // 获取繁殖记录
  const { data: records, isLoading, refetch } = useBreedingRecords(pairId)

  // 繁殖记录操作
  const { createRecord, updateRecord, isCreating, isUpdating } = useBreedingRecordOperations()

  // 表单验证
  const validateForm = () => {
    if (!formData.clutch_number) {
      toast.error('请输入窝数')
      return false
    }
    const eggCount = parseInt(formData.egg_count)
    if (!validateEggCount(eggCount)) {
      toast.error('蛋数必须在0-4之间')
      return false
    }
    const hatchedCount = parseInt(formData.hatched_count)
    if (!validateHatchedCount(hatchedCount, eggCount)) {
      toast.error('孵化数不能大于蛋数')
      return false
    }
    const fledgedCount = parseInt(formData.fledged_count)
    if (!validateFledgedCount(fledgedCount, hatchedCount)) {
      toast.error('出飞数不能大于孵化数')
      return false
    }
    return true
  }

  // 处理创建记录
  const handleCreateRecord = async () => {
    if (!validateForm()) return

    try {
      await createRecord.mutateAsync({
        pair_id: pairId,
        clutch_number: parseInt(formData.clutch_number),
        egg_count: parseInt(formData.egg_count),
        first_egg_date: formData.first_egg_date || undefined,
        second_egg_date: formData.second_egg_date || undefined,
        notes: formData.notes || undefined,
      })

      toast.success('繁殖记录创建成功')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('创建繁殖记录失败: ' + error.message)
    }
  }

  // 处理更新记录
  const handleUpdateRecord = async () => {
    if (!selectedRecord || !validateForm()) return

    try {
      await updateRecord.mutateAsync({
        id: selectedRecord.id,
        first_hatch_date: formData.first_hatch_date || undefined,
        second_hatch_date: formData.second_hatch_date || undefined,
        hatched_count: parseInt(formData.hatched_count),
        fledged_count: parseInt(formData.fledged_count),
        first_chick_id: formData.first_chick_id || undefined,
        second_chick_id: formData.second_chick_id || undefined,
        notes: formData.notes || undefined,
      })

      toast.success('繁殖记录更新成功')
      setIsEditDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('更新繁殖记录失败: ' + error.message)
    }
  }

  // 处理删除记录
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return

    // 这里应该调用删除API，但由于我们的Hook没有删除功能，暂时提示
    toast.warning('删除功能开发中...')
    setIsDeleteDialogOpen(false)
    setSelectedRecord(null)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      clutch_number: '',
      egg_count: '2',
      first_egg_date: '',
      second_egg_date: '',
      hatched_count: '0',
      fledged_count: '0',
      first_hatch_date: '',
      second_hatch_date: '',
      notes: '',
    })
    setSelectedRecord(null)
  }

  // 打开编辑对话框
  const openEditDialog = (record: any) => {
    setSelectedRecord(record)
    setFormData({
      clutch_number: record.clutch_number.toString(),
      egg_count: record.egg_count.toString(),
      first_egg_date: record.first_egg_date || '',
      second_egg_date: record.second_egg_date || '',
      hatched_count: record.hatched_count.toString(),
      fledged_count: record.fledged_count.toString(),
      first_hatch_date: record.first_hatch_date || '',
      second_hatch_date: record.second_hatch_date || '',
      notes: record.notes || '',
    })
    setIsEditDialogOpen(true)
  }

  // 计算统计信息
  const calculateStats = () => {
    if (!records || records.length === 0) {
      return { totalClutches: 0, totalEggs: 0, totalHatched: 0, totalFledged: 0 }
    }

    const stats = records.reduce(
      (acc, record) => ({
        totalClutches: acc.totalClutches + 1,
        totalEggs: acc.totalEggs + record.egg_count,
        totalHatched: acc.totalHatched + record.hatched_count,
        totalFledged: acc.totalFledged + record.fledged_count,
      }),
      { totalClutches: 0, totalEggs: 0, totalHatched: 0, totalFledged: 0 }
    )

    return stats
  }

  const stats = calculateStats()
  const hatchRate = stats.totalEggs > 0 ? (stats.totalHatched / stats.totalEggs) * 100 : 0
  const fledgeRate = stats.totalHatched > 0 ? (stats.totalFledged / stats.totalHatched) * 100 : 0

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">繁殖记录</h2>
          {pairInfo && (
            <p className="text-gray-600">
              {pairInfo.sire_ring_number} × {pairInfo.dam_ring_number}
              {pairInfo.sire_name && pairInfo.dam_name && (
                <span className="ml-2">({pairInfo.sire_name} × {pairInfo.dam_name})</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <div>总窝数: <span className="font-medium">{stats.totalClutches}</span></div>
            <div className="ml-4">总蛋数: <span className="font-medium">{stats.totalEggs}</span></div>
            <div className="ml-4">
              孵化: <span className="font-medium text-blue-600">{stats.totalHatched}</span>
              ({hatchRate.toFixed(1)}%)
            </div>
            <div className="ml-4">
              出飞: <span className="font-medium text-green-600">{stats.totalFledged}</span>
              ({fledgeRate.toFixed(1)}%)
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建记录
          </Button>
        </div>
      </div>

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>繁殖记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无繁殖记录</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一条记录
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">窝数</TableHead>
                    <TableHead>产蛋信息</TableHead>
                    <TableHead>孵化信息</TableHead>
                    <TableHead>出飞信息</TableHead>
                    <TableHead>成功率</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records
                    .sort((a, b) => b.clutch_number - a.clutch_number)
                    .map((record) => {
                      const recordHatchRate =
                        record.egg_count > 0 ? (record.hatched_count / record.egg_count) * 100 : 0
                      const recordFledgeRate =
                        record.hatched_count > 0 ? (record.fledged_count / record.hatched_count) * 100 : 0

                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Badge variant="outline">
                              第 {record.clutch_number} 窝
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Egg className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{record.egg_count} 枚蛋</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.first_egg_date && (
                                  <div>第一枚: {formatDate(record.first_egg_date)}</div>
                                )}
                                {record.second_egg_date && (
                                  <div>第二枚: {formatDate(record.second_egg_date)}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Baby className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  孵化 {record.hatched_count} 只
                                </span>
                                {record.hatched_count > 0 && (
                                  <Badge
                                    variant={recordHatchRate >= 80 ? 'default' : 'destructive'}
                                  className="text-xs"
                                  >
                                    {recordHatchRate.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.first_hatch_date && (
                                  <div>第一只: {formatDate(record.first_hatch_date)}</div>
                                )}
                                {record.second_hatch_date && (
                                  <div>第二只: {formatDate(record.second_hatch_date)}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Bird className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  出飞 {record.fledged_count} 只
                                </span>
                                {record.fledged_count > 0 && (
                                  <Badge
                                    variant={recordFledgeRate >= 80 ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {recordFledgeRate.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {recordHatchRate >= 80 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span>孵化率: {recordHatchRate.toFixed(1)}%</span>
                              </div>
                              {record.hatched_count > 0 && (
                                <div className="flex items-center gap-2">
                                  {recordFledgeRate >= 80 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                  <span>出飞率: {recordFledgeRate.toFixed(1)}%</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.notes ? (
                              <div className="max-w-xs truncate" title={record.notes}>
                                {record.notes}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(record)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRecord(record)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建记录对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建繁殖记录</DialogTitle>
            <DialogDescription>
              记录新一窝蛋的产蛋、孵化、出飞情况
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clutch_number">窝数</Label>
              <Input
                id="clutch_number"
                type="number"
                placeholder="输入窝数"
                value={formData.clutch_number}
                onChange={(e) => setFormData({ ...formData, clutch_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="egg_count">蛋数</Label>
              <Select value={formData.egg_count} onValueChange={(value) => setFormData({ ...formData, egg_count: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1枚</SelectItem>
                  <SelectItem value="2">2枚</SelectItem>
                  <SelectItem value="3">3枚</SelectItem>
                  <SelectItem value="4">4枚</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_egg_date">第一枚蛋日期</Label>
                <Input
                  id="first_egg_date"
                  type="date"
                  value={formData.first_egg_date}
                  onChange={(e) => setFormData({ ...formData, first_egg_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="second_egg_date">第二枚蛋日期</Label>
                <Input
                  id="second_egg_date"
                  type="date"
                  value={formData.second_egg_date}
                  onChange={(e) => setFormData({ ...formData, second_egg_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                placeholder="添加备注信息（可选）"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateRecord} disabled={isCreating}>
              {isCreating ? '创建中...' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑记录对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑繁殖记录</DialogTitle>
            <DialogDescription>
              更新孵化、出飞等记录信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hatched_count">孵化数量</Label>
                <Input
                  id="hatched_count"
                  type="number"
                  placeholder="输入孵化数量"
                  value={formData.hatched_count}
                  onChange={(e) => setFormData({ ...formData, hatched_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fledged_count">出飞数量</Label>
                <Input
                  id="fledged_count"
                  type="number"
                  placeholder="输入出飞数量"
                  value={formData.fledged_count}
                  onChange={(e) => setFormData({ ...formData, fledged_count: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_hatch_date">第一只孵化日期</Label>
                <Input
                  id="first_hatch_date"
                  type="date"
                  value={formData.first_hatch_date}
                  onChange={(e) => setFormData({ ...formData, first_hatch_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="second_hatch_date">第二只孵化日期</Label>
                <Input
                  id="second_hatch_date"
                  type="date"
                  value={formData.second_hatch_date}
                  onChange={(e) => setFormData({ ...formData, second_hatch_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                placeholder="添加备注信息（可选）"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateRecord} disabled={isUpdating}>
              {isUpdating ? '更新中...' : '更新'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除记录</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除第 {selectedRecord?.clutch_number} 窝的繁殖记录吗？
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}