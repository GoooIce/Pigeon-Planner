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
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Heart,
  Calendar,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useBreedingPairs,
  useBreedingPairOperations,
  useSearchBreedingPairs,
  formatDate,
  formatPercentage,
  getStatusColor,
  getStatusText,
  getSexText,
  validatePairDate,
} from '@/hooks/useBreeding'

interface PairManagerProps {
  className?: string
}

export function PairManager({ className }: PairManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPair, setSelectedPair] = useState<any>(null)
  const [formData, setFormData] = useState({
    sire_id: '',
    dam_id: '',
    pair_date: '',
    nest_box_id: '',
    notes: '',
  })

  const PAGE_SIZE = 20

  // 获取配对列表
  const { data: pairs, isLoading, refetch } = useBreedingPairs(
    PAGE_SIZE,
    currentPage * PAGE_SIZE,
    statusFilter === 'all' ? undefined : statusFilter
  )

  // 搜索配对
  const { data: searchResults } = useSearchBreedingPairs(searchQuery)

  // 配对操作
  const { createPair, updatePair, deletePair, isCreating, isUpdating, isDeleting } = useBreedingPairOperations()

  // 表单验证
  const validateForm = () => {
    if (!formData.sire_id) {
      toast.error('请选择雄鸽')
      return false
    }
    if (!formData.dam_id) {
      toast.error('请选择雌鸽')
      return false
    }
    if (formData.sire_id === formData.dam_id) {
      toast.error('雄鸽和雌鸽不能是同一只鸽子')
      return false
    }
    if (!formData.pair_date) {
      toast.error('请选择配对日期')
      return false
    }
    if (!validatePairDate(formData.pair_date)) {
      toast.error('配对日期不能是未来时间')
      return false
    }
    return true
  }

  // 处理创建配对
  const handleCreatePair = async () => {
    if (!validateForm()) return

    try {
      await createPair.mutateAsync({
        sire_id: parseInt(formData.sire_id),
        dam_id: parseInt(formData.dam_id),
        pair_date: formData.pair_date,
        nest_box_id: formData.nest_box_id ? parseInt(formData.nest_box_id) : undefined,
        notes: formData.notes || undefined,
      })

      toast.success('配对创建成功')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('创建配对失败: ' + error.message)
    }
  }

  // 处理更新配对
  const handleUpdatePair = async () => {
    if (!selectedPair || !validateForm()) return

    try {
      await updatePair.mutateAsync({
        id: selectedPair.id,
        separate_date: formData.separate_date || undefined,
        status: formData.status || undefined,
        nest_box_id: formData.nest_box_id ? parseInt(formData.nest_box_id) : undefined,
        notes: formData.notes || undefined,
      })

      toast.success('配对更新成功')
      setIsEditDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('更新配对失败: ' + error.message)
    }
  }

  // 处理删除配对
  const handleDeletePair = async () => {
    if (!selectedPair) return

    try {
      await deletePair.mutateAsync(selectedPair.id)
      toast.success('配对删除成功')
      setIsDeleteDialogOpen(false)
      setSelectedPair(null)
      refetch()
    } catch (error) {
      toast.error('删除配对失败: ' + error.message)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      sire_id: '',
      dam_id: '',
      pair_date: '',
      nest_box_id: '',
      notes: '',
    })
    setSelectedPair(null)
  }

  // 打开编辑对话框
  const openEditDialog = (pair: any) => {
    setSelectedPair(pair)
    setFormData({
      sire_id: pair.sire_id.toString(),
      dam_id: pair.dam_id.toString(),
      pair_date: pair.pair_date,
      nest_box_id: pair.nest_box_id?.toString() || '',
      notes: pair.notes || '',
    })
    setIsEditDialogOpen(true)
  }

  // 显示的配对数据
  const displayPairs = searchQuery ? searchResults : pairs || []

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索配对..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 状态筛选 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="separated">分离</SelectItem>
              <SelectItem value="completed">完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 新建按钮 */}
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建配对
        </Button>
      </div>

      {/* 配对列表 */}
      <Card>
        <CardHeader>
          <CardTitle>配对列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : displayPairs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无配对记录</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个配对
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>配对信息</TableHead>
                    <TableHead>配对日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>巢箱</TableHead>
                    <TableHead>繁殖统计</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPairs.map((pair) => (
                    <TableRow key={pair.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {pair.sire_ring_number} × {pair.dam_ring_number}
                            </span>
                            {(pair.sire_name || pair.dam_name) && (
                              <span className="text-sm text-gray-500">
                                ({pair.sire_name || pair.sire_ring_number} × {pair.dam_name || pair.dam_ring_number})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getSexText(pair.sire_sex || 0))}`}>
                              ♂ {pair.sire_ring_number}
                            </span>
                            <span className="text-gray-400">×</span>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getSexText(pair.dam_sex || 1))}`}>
                              ♀ {pair.dam_ring_number}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(pair.pair_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pair.status === 'active' ? 'default' : 'secondary'}>
                          {getStatusText(pair.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pair.nest_box_number ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{pair.nest_box_number}</span>
                            {pair.nest_location && (
                              <span className="text-sm text-gray-500">({pair.nest_location})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">未分配</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>窝数: {pair.total_clutches}</div>
                          <div>蛋数: {pair.total_eggs}</div>
                          <div>孵化: {pair.total_hatched}</div>
                          <div>出飞: {pair.total_fledged}</div>
                          <div className="flex gap-2">
                            <span className="text-blue-600">
                              孵化率: {formatPercentage(pair.hatch_rate)}
                            </span>
                            <span className="text-green-600">
                              出飞率: {formatPercentage(pair.fledge_rate)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pair.notes ? (
                          <div className="max-w-xs truncate" title={pair.notes}>
                            {pair.notes}
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
                            <DropdownMenuItem onClick={() => openEditDialog(pair)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPair(pair)
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页控制 */}
      {!searchQuery && (pairs || []).length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            显示第 {currentPage * PAGE_SIZE + 1} 到 {Math.min((currentPage + 1) * PAGE_SIZE, pairs.length)} 条，共 {pairs.length} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={(currentPage + 1) * PAGE_SIZE >= (pairs.length || 0)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 创建配对对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建新配对</DialogTitle>
            <DialogDescription>
              选择两只鸽子进行配对，系统会自动验证配对条件
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sire">雄鸽</Label>
                <Input
                  id="sire"
                  placeholder="输入雄鸽环号"
                  value={formData.sire_id}
                  onChange={(e) => setFormData({ ...formData, sire_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dam">雌鸽</Label>
                <Input
                  id="dam"
                  placeholder="输入雌鸽环号"
                  value={formData.dam_id}
                  onChange={(e) => setFormData({ ...formData, dam_id: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pair_date">配对日期</Label>
              <Input
                id="pair_date"
                type="date"
                value={formData.pair_date}
                onChange={(e) => setFormData({ ...formData, pair_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nest_box">巢箱</Label>
              <Input
                id="nest_box"
                placeholder="输入巢箱编号（可选）"
                value={formData.nest_box_id}
                onChange={(e) => setFormData({ ...formData, nest_box_id: e.target.value })}
              />
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
            <Button onClick={handleCreatePair} disabled={isCreating}>
              {isCreating ? '创建中...' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑配对对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑配对</DialogTitle>
            <DialogDescription>
              更新配对信息和状态
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="separated">分离</SelectItem>
                  <SelectItem value="completed">完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="separate_date">分离日期</Label>
              <Input
                id="separate_date"
                type="date"
                value={formData.separate_date}
                onChange={(e) => setFormData({ ...formData, separate_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nest_box">巢箱</Label>
              <Input
                id="nest_box"
                placeholder="输入巢箱编号（可选）"
                value={formData.nest_box_id}
                onChange={(e) => setFormData({ ...formData, nest_box_id: e.target.value })}
              />
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
            <Button onClick={handleUpdatePair} disabled={isUpdating}>
              {isUpdating ? '更新中...' : '更新'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除配对</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除配对 "{selectedPair?.sire_ring_number} × {selectedPair?.dam_ring_number}" 吗？
              此操作不可撤销，且只能删除没有繁殖记录的配对。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePair}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}