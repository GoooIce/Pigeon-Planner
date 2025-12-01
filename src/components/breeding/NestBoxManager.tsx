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
  Home,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  MapPin,
  Users,
  Wrench,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'
import { useNestBoxes, useAssignNestBox, getStatusColor, getStatusText } from '@/hooks/useBreeding'

// 鸽子数据类型
interface Pigeon {
  id: number
  ring_number: string
  year: number
  name?: string
  sex: number // 0: male, 1: female, 2: unknown
  color?: string
  strain?: string
  loft?: string
  status: number // 1: active, other: inactive
}

// 鸽子数据Hook
function usePigeons() {
  return useQuery({
    queryKey: ['pigeons'],
    queryFn: async (): Promise<Pigeon[]> => {
      return await invoke('get_all_pigeons')
    }
  })
}

interface NestBoxManagerProps {
  className?: string
}

export function NestBoxManager({ className }: NestBoxManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedNestBox, setSelectedNestBox] = useState<any>(null)
  const [formData, setFormData] = useState({
    box_number: '',
    location: '',
    status: 'available',
    notes: '',
  })
  const [assignFormData, setAssignFormData] = useState({
    pair_id: '',
    nest_box_id: '',
  })

  // 获取巢箱列表
  const { data: nestBoxes, isLoading, refetch } = useNestBoxes(
    statusFilter === 'all' ? undefined : statusFilter
  )

  // 获取鸽子列表（用于分配巢箱）
  const { data: pigeons } = usePigeons()

  // 巢箱分配操作
  const { assignNestBox, isAssigning } = useAssignNestBox()

  // 过滤巢箱
  const filteredNestBoxes = nestBoxes?.filter(box => {
    if (searchQuery && !box.box_number.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !box.location?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  }) || []

  // 表单验证
  const validateForm = () => {
    if (!formData.box_number.trim()) {
      toast.error('请输入巢箱编号')
      return false
    }
    return true
  }

  // 验证分配表单
  const validateAssignForm = () => {
    if (!assignFormData.pair_id) {
      toast.error('请选择配对')
      return false
    }
    if (!assignFormData.nest_box_id) {
      toast.error('请选择巢箱')
      return false
    }
    return true
  }

  // 处理创建巢箱
  const handleCreateNestBox = async () => {
    if (!validateForm()) return

    try {
      // 这里应该调用创建巢箱的API，但由于Hook中没有创建功能，暂时提示
      toast.warning('创建巢箱功能开发中...')
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('创建巢箱失败: ' + error.message)
    }
  }

  // 处理分配巢箱
  const handleAssignNestBox = async () => {
    if (!validateAssignForm()) return

    try {
      await assignNestBox.mutateAsync({
        pair_id: parseInt(assignFormData.pair_id),
        nest_box_id: parseInt(assignFormData.nest_box_id),
      })

      toast.success('巢箱分配成功')
      setIsAssignDialogOpen(false)
      setAssignFormData({ pair_id: '', nest_box_id: '' })
      refetch()
    } catch (error) {
      toast.error('分配巢箱失败: ' + error.message)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      box_number: '',
      location: '',
      status: 'available',
      notes: '',
    })
    setSelectedNestBox(null)
  }

  // 获取活跃配对列表
  const activePairs = pigeons?.filter(pigeon => pigeon.status === 1) || []

  // 打开分配对话框
  const openAssignDialog = (nestBox: any) => {
    setSelectedNestBox(nestBox)
    setAssignFormData({
      pair_id: nestBox.current_pair_id?.toString() || '',
      nest_box_id: nestBox.id?.toString() || '',
    })
    setIsAssignDialogOpen(true)
  }

  // 统计信息
  const stats = {
    total: nestBoxes?.length || 0,
    available: nestBoxes?.filter(box => box.status === 'available').length || 0,
    occupied: nestBoxes?.filter(box => box.status === 'occupied').length || 0,
    maintenance: nestBoxes?.filter(box => box.status === 'maintenance').length || 0,
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 工具栏和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索巢箱..."
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
              <SelectItem value="available">可用</SelectItem>
              <SelectItem value="occupied">占用</SelectItem>
              <SelectItem value="maintenance">维护</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-400" />
              <span>总计: <span className="font-medium">{stats.total}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>可用: <span className="font-medium text-green-600">{stats.available}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>占用: <span className="font-medium text-blue-600">{stats.occupied}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-400" />
              <span>维护: <span className="font-medium text-yellow-600">{stats.maintenance}</span></span>
            </div>
          </div>

          {/* 新建按钮 */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建巢箱
          </Button>
        </div>
      </div>

      {/* 巢箱列表 */}
      <Card>
        <CardHeader>
          <CardTitle>巢箱管理</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNestBoxes.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无巢箱记录</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个巢箱
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>巢箱信息</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>当前配对</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNestBoxes.map((nestBox) => (
                    <TableRow key={nestBox.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{nestBox.box_number}</div>
                            <div className="text-sm text-gray-500">
                              ID: {nestBox.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={nestBox.status === 'available' ? 'default' :
                                   nestBox.status === 'occupied' ? 'secondary' : 'destructive'}
                        >
                          {getStatusText(nestBox.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {nestBox.current_pair_info ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm">
                                  {nestBox.current_pair_info.sire_ring_number} × {nestBox.current_pair_info.dam_ring_number}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {nestBox.current_pair_info.sire_name && nestBox.current_pair_info.dam_name && (
                                    <span>({nestBox.current_pair_info.sire_name} × {nestBox.current_pair_info.dam_name})</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  配对日期: {new Date(nestBox.current_pair_info.pair_date).toLocaleDateString('zh-CN')}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getStatusText(nestBox.current_pair_info.status)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400">未分配</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {nestBox.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{nestBox.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">未设置</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {nestBox.notes ? (
                          <div className="max-w-xs truncate" title={nestBox.notes}>
                            {nestBox.notes}
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
                            {nestBox.status === 'available' && (
                              <DropdownMenuItem onClick={() => openAssignDialog(nestBox)}>
                                <Users className="h-4 w-4 mr-2" />
                                分配配对
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setSelectedNestBox(nestBox)
                              setIsEditDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            {nestBox.status === 'available' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  // 这里可以添加维护操作
                                  toast.info('维护功能开发中...')
                                }}>
                                  <Wrench className="h-4 w-4 mr-2" />
                                  设置维护
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* 创建巢箱对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建新巢箱</DialogTitle>
            <DialogDescription>
              添加新的鸽子巢箱到系统中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="box_number">巢箱编号</Label>
              <Input
                id="box_number"
                placeholder="输入巢箱编号，如：A-001"
                value={formData.box_number}
                onChange={(e) => setFormData({ ...formData, box_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                placeholder="输入巢箱位置，如：鸽舍1号"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">初始状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">可用</SelectItem>
                  <SelectItem value="maintenance">维护</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleCreateNestBox}>
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分配配对对话框 */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>分配配对</DialogTitle>
            <DialogDescription>
              将配对分配给巢箱 {selectedNestBox?.box_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedNestBox && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">巢箱 {selectedNestBox.box_number}</span>
                  {selectedNestBox.location && (
                    <span className="text-gray-500">({selectedNestBox.location})</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pair_id">选择配对</Label>
              <Select
                value={assignFormData.pair_id}
                onValueChange={(value) => setAssignFormData({ ...assignFormData, pair_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择要分配的配对" />
                </SelectTrigger>
                <SelectContent>
                  {activePairs.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id.toString()}>
                      {pair.ring_number} {pair.name && `(${pair.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAssignNestBox}
              disabled={isAssigning || !assignFormData.pair_id}
            >
              {isAssigning ? '分配中...' : '确认分配'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑巢箱对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑巢箱</DialogTitle>
            <DialogDescription>
              更新巢箱信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedNestBox && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">巢箱 {selectedNestBox.box_number}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_status">状态</Label>
              <Select
                value={selectedNestBox?.status || 'available'}
                onValueChange={(value) => {
                  if (selectedNestBox) {
                    setFormData({ ...formData, status: value })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">可用</SelectItem>
                  <SelectItem value="occupied">占用</SelectItem>
                  <SelectItem value="maintenance">维护</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_notes">备注</Label>
              <Textarea
                id="edit_notes"
                placeholder="更新备注信息（可选）"
                value={selectedNestBox?.notes || ''}
                onChange={(e) => {
                  if (selectedNestBox) {
                    setFormData({ ...formData, notes: e.target.value })
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // 这里应该调用更新API，但由于Hook中没有更新功能，暂时提示
              toast.warning('更新巢箱功能开发中...')
              setIsEditDialogOpen(false)
            }}>
              保存更改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}