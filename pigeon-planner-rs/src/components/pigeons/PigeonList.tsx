import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

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
  image_path?: string
  sire_ring_number?: string
  sire_year?: number
  dam_ring_number?: string
  dam_year?: number
  extra_fields?: string
  created_at: string
  updated_at: string
}

const PigeonList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPigeon, setEditingPigeon] = useState<Pigeon | null>(null)
  const queryClient = useQueryClient()

  const { data: pigeons = [], isLoading, error } = useQuery({
    queryKey: ['pigeons'],
    queryFn: async () => {
      const result = await invoke<Pigeon[]>('get_all_pigeons')
      return result
    }
  })

  const createPigeonMutation = useMutation({
    mutationFn: async (pigeonData: Partial<Pigeon>) => {
      return invoke<number>('create_pigeon', { pigeon: pigeonData })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pigeons'] })
      setIsAddDialogOpen(false)
      toast.success('鸽子添加成功')
    },
    onError: (error) => {
      toast.error('添加鸽子失败: ' + error)
    }
  })

  const updatePigeonMutation = useMutation({
    mutationFn: async ({ id, pigeon }: { id: number; pigeon: Partial<Pigeon> }) => {
      return invoke<boolean>('update_pigeon', { id, pigeon })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pigeons'] })
      setEditingPigeon(null)
      toast.success('鸽子信息更新成功')
    },
    onError: (error) => {
      toast.error('更新鸽子失败: ' + error)
    }
  })

  const deletePigeonMutation = useMutation({
    mutationFn: async (id: number) => {
      return invoke<boolean>('delete_pigeon', { id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pigeons'] })
      toast.success('鸽子删除成功')
    },
    onError: (error) => {
      toast.error('删除鸽子失败: ' + error)
    }
  })

  const filteredPigeons = pigeons.filter(pigeon =>
    pigeon.ring_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pigeon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pigeon.strain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSexLabel = (sex: number) => {
    switch (sex) {
      case 1: return '雄'
      case 2: return '雌'
      default: return '未知'
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return '活跃'
      case 2: return '已售出'
      case 3: return '已死亡'
      default: return '未知'
    }
  }

  const getStatusVariant = (status: number) => {
    switch (status) {
      case 1: return 'default'
      case 2: return 'secondary'
      case 3: return 'destructive'
      default: return 'outline'
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const pigeonData = {
      ring_number: formData.get('ring_number') as string,
      year: parseInt(formData.get('year') as string),
      name: formData.get('name') as string || undefined,
      color: formData.get('color') as string || undefined,
      sex: parseInt(formData.get('sex') as string),
      strain: formData.get('strain') as string || undefined,
      loft: formData.get('loft') as string || undefined,
      sire_ring_number: formData.get('sire_ring_number') as string || undefined,
      sire_year: formData.get('sire_year') ? parseInt(formData.get('sire_year') as string) : undefined,
      dam_ring_number: formData.get('dam_ring_number') as string || undefined,
      dam_year: formData.get('dam_year') ? parseInt(formData.get('dam_year') as string) : undefined,
    }

    if (editingPigeon) {
      updatePigeonMutation.mutate({ id: editingPigeon.id, pigeon: pigeonData })
    } else {
      createPigeonMutation.mutate(pigeonData)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这只鸽子吗？')) {
      deletePigeonMutation.mutate(id)
    }
  }

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">鸽子管理</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加鸽子
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加新鸽子</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ring_number">足环号 *</Label>
                  <Input id="ring_number" name="ring_number" required />
                </div>
                <div>
                  <Label htmlFor="year">年份 *</Label>
                  <Input id="year" name="year" type="number" required />
                </div>
              </div>
              <div>
                <Label htmlFor="name">名字</Label>
                <Input id="name" name="name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">颜色</Label>
                  <Input id="color" name="color" />
                </div>
                <div>
                  <Label htmlFor="sex">性别 *</Label>
                  <Select name="sex" required>
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">雄</SelectItem>
                      <SelectItem value="2">雌</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strain">品种</Label>
                  <Input id="strain" name="strain" />
                </div>
                <div>
                  <Label htmlFor="loft">鸽舍</Label>
                  <Input id="loft" name="loft" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sire_ring_number">父足环号</Label>
                  <Input id="sire_ring_number" name="sire_ring_number" />
                </div>
                <div>
                  <Label htmlFor="sire_year">父年份</Label>
                  <Input id="sire_year" name="sire_year" type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dam_ring_number">母足环号</Label>
                  <Input id="dam_ring_number" name="dam_ring_number" />
                </div>
                <div>
                  <Label htmlFor="dam_year">母年份</Label>
                  <Input id="dam_year" name="dam_year" type="number" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingPigeon ? '更新' : '添加'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>鸽子列表</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="搜索足环号、名字或品种..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>足环号</TableHead>
                <TableHead>年份</TableHead>
                <TableHead>名字</TableHead>
                <TableHead>颜色</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>品种</TableHead>
                <TableHead>鸽舍</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPigeons.map((pigeon) => (
                <TableRow key={pigeon.id}>
                  <TableCell className="font-medium">{pigeon.ring_number}</TableCell>
                  <TableCell>{pigeon.year}</TableCell>
                  <TableCell>{pigeon.name || '-'}</TableCell>
                  <TableCell>{pigeon.color || '-'}</TableCell>
                  <TableCell>{getSexLabel(pigeon.sex)}</TableCell>
                  <TableCell>{pigeon.strain || '-'}</TableCell>
                  <TableCell>{pigeon.loft || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(pigeon.status)}>
                      {getStatusLabel(pigeon.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPigeon(pigeon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pigeon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPigeons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '没有找到匹配的鸽子' : '还没有添加任何鸽子'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={!!editingPigeon} onOpenChange={() => setEditingPigeon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑鸽子信息</DialogTitle>
          </DialogHeader>
          {editingPigeon && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editingPigeon.id} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_ring_number">足环号 *</Label>
                  <Input
                    id="edit_ring_number"
                    name="ring_number"
                    defaultValue={editingPigeon.ring_number}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_year">年份 *</Label>
                  <Input
                    id="edit_year"
                    name="year"
                    type="number"
                    defaultValue={editingPigeon.year}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_name">名字</Label>
                <Input id="edit_name" name="name" defaultValue={editingPigeon.name || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_color">颜色</Label>
                  <Input id="edit_color" name="color" defaultValue={editingPigeon.color || ''} />
                </div>
                <div>
                  <Label htmlFor="edit_sex">性别 *</Label>
                  <Select name="sex" defaultValue={editingPigeon.sex.toString()} required>
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">雄</SelectItem>
                      <SelectItem value="2">雌</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_strain">品种</Label>
                  <Input id="edit_strain" name="strain" defaultValue={editingPigeon.strain || ''} />
                </div>
                <div>
                  <Label htmlFor="edit_loft">鸽舍</Label>
                  <Input id="edit_loft" name="loft" defaultValue={editingPigeon.loft || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_sire_ring_number">父足环号</Label>
                  <Input
                    id="edit_sire_ring_number"
                    name="sire_ring_number"
                    defaultValue={editingPigeon.sire_ring_number || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_sire_year">父年份</Label>
                  <Input
                    id="edit_sire_year"
                    name="sire_year"
                    type="number"
                    defaultValue={editingPigeon.sire_year || ''}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_dam_ring_number">母足环号</Label>
                  <Input
                    id="edit_dam_ring_number"
                    name="dam_ring_number"
                    defaultValue={editingPigeon.dam_ring_number || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dam_year">母年份</Label>
                  <Input
                    id="edit_dam_year"
                    name="dam_year"
                    type="number"
                    defaultValue={editingPigeon.dam_year || ''}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                更新
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PigeonList