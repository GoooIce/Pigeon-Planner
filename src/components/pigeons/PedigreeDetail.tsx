import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Edit,
  Save,
  X,
  User,
  Users,
  Link,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  usePedigree,
  usePedigreeStats,
  useUpdateParentRelationship,
  formatSex,
  formatRelationshipType
} from '@/hooks/usePedigree';
import type { PedigreeNode, ParentRelationshipUpdate } from '@/hooks/usePedigree';
import { usePigeons } from '@/hooks/usePigeons';

interface PedigreeDetailProps {
  pigeonId: number;
  className?: string;
}

interface ParentEditorProps {
  pigeonId: number;
  currentParentId?: number;
  parentType: 'sire' | 'dam';
  onSave: (update: ParentRelationshipUpdate) => void;
  onCancel: () => void;
}

const ParentEditor: React.FC<ParentEditorProps> = ({
  pigeonId,
  currentParentId,
  parentType,
  onSave,
  onCancel
}) => {
  const { data: pigeons } = usePigeons();
  const [selectedParentId, setSelectedParentId] = useState<string>(currentParentId?.toString() || '');
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤鸽子列表
  const filteredPigeons = pigeons?.filter(pigeon => {
    // 父鸽必须是雄性，母鸽必须是雌性
    const correctSex = parentType === 'sire' ? pigeon.sex === 0 : pigeon.sex === 1;

    // 排除自己
    const notSelf = pigeon.id !== pigeonId;

    // 搜索过滤
    const matchesSearch = searchTerm === '' ||
      pigeon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.ring_number.toLowerCase().includes(searchTerm.toLowerCase());

    return correctSex && notSelf && matchesSearch;
  }) || [];

  const handleSave = () => {
    if (selectedParentId) {
      const update: ParentRelationshipUpdate = {
        pigeon_id: pigeonId,
        [parentType === 'sire' ? 'sire_id' : 'dam_id']: parseInt(selectedParentId)
      };
      onSave(update);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">搜索{parentType === 'sire' ? '父鸽' : '母鸽'}</Label>
        <Input
          id="search"
          placeholder="输入环号或名称搜索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label>选择{parentType === 'sire' ? '父鸽' : '母鸽'}</Label>
        <Select value={selectedParentId} onValueChange={setSelectedParentId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={`请选择${parentType === 'sire' ? '父鸽' : '母鸽'}`} />
          </SelectTrigger>
          <SelectContent>
            {filteredPigeons.map((pigeon) => (
              <SelectItem key={pigeon.id} value={pigeon.id.toString()}>
                {pigeon.name || `${pigeon.ring_number} (${pigeon.year})`}
                <span className="text-xs text-gray-500 ml-2">
                  {pigeon.ring_number} • {pigeon.year} • {formatSex(pigeon.sex)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-2 pt-2">
        <Button onClick={handleSave} disabled={!selectedParentId}>
          <Save className="w-4 h-4 mr-1" />
          保存
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
      </div>
    </div>
  );
};

export const PedigreeDetail: React.FC<PedigreeDetailProps> = ({
  pigeonId,
  className = ''
}) => {
  const [editingParent, setEditingParent] = useState<'sire' | 'dam' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: pedigree, isLoading, error, refetch } = usePedigree(pigeonId);
  const { data: stats } = usePedigreeStats(pigeonId);
  const updateParentRelationship = useUpdateParentRelationship();

  // 查找父母信息
  const sire = pedigree?.ancestors.find(a => a.id === pedigree?.root_pigeon.sire_id);
  const dam = pedigree?.ancestors.find(a => a.id === pedigree?.root_pigeon.dam_id);

  const handleSaveParent = (update: ParentRelationshipUpdate) => {
    updateParentRelationship.mutate(update, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setEditingParent(null);
        refetch();
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingParent(null);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-500">正在加载血统详情...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !pedigree) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-700">加载血统详情失败</p>
            <p className="text-sm text-gray-500 mt-1">{error?.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rootPigeon = pedigree.root_pigeon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>基本信息</span>
            <Badge variant="outline">{formatSex(rootPigeon.sex)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">环号</Label>
              <p className="text-lg font-semibold">{rootPigeon.ring_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">出生年份</Label>
              <p className="text-lg">{rootPigeon.year}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">名称</Label>
              <p className="text-lg">{rootPigeon.name || '未设置'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">品种</Label>
              <p className="text-lg">{rootPigeon.strain || '未设置'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">羽色</Label>
              <p className="text-lg">{rootPigeon.color || '未设置'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">鸽舍</Label>
              <p className="text-lg">{rootPigeon.loft || '未设置'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 父母关系 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            父母关系
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 父鸽 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">父鸽</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingParent('sire');
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </Button>
              </div>

              {sire ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {sire.name || `${sire.ring_number} (${sire.year})`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {sire.ring_number} • {sire.year} • {sire.strain || '未知品种'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    未设置父鸽信息
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-2 p-0 h-auto"
                      onClick={() => {
                        setEditingParent('sire');
                        setIsDialogOpen(true);
                      }}
                    >
                      立即设置
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* 母鸽 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">母鸽</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingParent('dam');
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </Button>
              </div>

              {dam ? (
                <Card className="bg-pink-50 border-pink-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {dam.name || `${dam.ring_number} (${dam.year})`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {dam.ring_number} • {dam.year} • {dam.strain || '未知品种'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    未设置母鸽信息
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-2 p-0 h-auto"
                      onClick={() => {
                        setEditingParent('dam');
                        setIsDialogOpen(true);
                      }}
                    >
                      立即设置
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 血统统计 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              血统统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_ancestors}</div>
                <div className="text-sm text-gray-600">总祖先数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total_generations}</div>
                <div className="text-sm text-gray-600">世代深度</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.sire_line_depth}</div>
                <div className="text-sm text-gray-600">父系深度</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{stats.dam_line_depth}</div>
                <div className="text-sm text-gray-600">母系深度</div>
              </div>
            </div>

            {stats.inbreeding_coefficient !== undefined && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">近交系数</span>
                  <Badge
                    variant={stats.inbreeding_coefficient > 0.25 ? 'destructive' :
                           stats.inbreeding_coefficient > 0.125 ? 'secondary' : 'default'}
                  >
                    {(stats.inbreeding_coefficient * 100).toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.inbreeding_coefficient > 0.25 ? '近交风险较高，建议谨慎配对' :
                   stats.inbreeding_coefficient > 0.125 ? '近交风险中等，需要注意' :
                   '近交风险较低'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 祖先概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="w-5 h-5 mr-2" />
            祖先概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sire-line" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sire-line">父系</TabsTrigger>
              <TabsTrigger value="dam-line">母系</TabsTrigger>
            </TabsList>

            <TabsContent value="sire-line" className="mt-4">
              <div className="space-y-2">
                {pedigree.ancestors
                  .filter(a => a.generation % 2 === 0) // 偶数代为父系
                  .sort((a, b) => a.generation - b.generation)
                  .map((ancestor) => (
                    <div
                      key={ancestor.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                          F{ancestor.generation - 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {ancestor.name || `${ancestor.ring_number} (${ancestor.year})`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ancestor.ring_number} • {ancestor.year}
                            {ancestor.strain && ` • ${ancestor.strain}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {pedigree.ancestors.filter(a => a.generation % 2 === 0).length === 0 && (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      暂无父系祖先信息
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dam-line" className="mt-4">
              <div className="space-y-2">
                {pedigree.ancestors
                  .filter(a => a.generation % 2 === 1) // 奇数代为母系
                  .sort((a, b) => a.generation - b.generation)
                  .map((ancestor) => (
                    <div
                      key={ancestor.id}
                      className="flex items-center justify-between p-3 bg-pink-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-xs font-medium">
                          F{ancestor.generation - 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {ancestor.name || `${ancestor.ring_number} (${ancestor.year})`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ancestor.ring_number} • {ancestor.year}
                            {ancestor.strain && ` • ${ancestor.strain}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {pedigree.ancestors.filter(a => a.generation % 2 === 1).length === 0 && (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      暂无母系祖先信息
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 编辑父母对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              编辑{editingParent === 'sire' ? '父鸽' : '母鸽'}信息
            </DialogTitle>
          </DialogHeader>
          {editingParent && (
            <ParentEditor
              pigeonId={pigeonId}
              currentParentId={editingParent === 'sire' ? sire?.id : dam?.id}
              parentType={editingParent}
              onSave={handleSaveParent}
              onCancel={handleCancelEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedigreeDetail;