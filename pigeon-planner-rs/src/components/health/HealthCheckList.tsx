import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Search, Filter, Calendar, User, Activity, Edit, Trash2, Eye } from 'lucide-react';
import { useHealthChecks, useDeleteHealthCheck, getHealthConditionColor } from '@/hooks/useHealth';
import { usePigeons } from '@/hooks/usePigeons';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckListProps {
  pigeonId?: number;
}

export function HealthCheckList({ pigeonId }: HealthCheckListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: healthChecks, isLoading, error } = useHealthChecks(pigeonId || 0, {
    enabled: !!pigeonId,
  });
  const { data: allPigeons } = usePigeons();
  const deleteHealthCheck = useDeleteHealthCheck();
  const { toast } = useToast();

  const filteredChecks = healthChecks?.filter(check => {
    const matchesSearch = searchTerm === '' ||
      allPigeons?.some(p =>
        p.id === check.pigeon_id &&
        (p.band_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())))
      ) ||
      check.examiner?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCondition = conditionFilter === 'all' || check.condition === conditionFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const checkDate = new Date(check.check_date);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          matchesDate = checkDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = checkDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = checkDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesCondition && matchesDate;
  }) || [];

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这条健康检查记录吗？')) {
      try {
        await deleteHealthCheck.mutateAsync(id);
        toast({
          title: '成功',
          description: '健康检查记录已删除',
        });
      } catch (error) {
        toast({
          title: '错误',
          description: '删除健康检查记录失败',
          variant: 'destructive',
        });
      }
    }
  };

  const getPigeonInfo = (pigeonId: number) => {
    return allPigeons?.find(p => p.id === pigeonId);
  };

  const formatWeight = (weight?: number) => {
    if (!weight) return '-';
    return `${weight.toFixed(1)} g`;
  };

  const formatTemperature = (temp?: number) => {
    if (!temp) return '-';
    return `${temp.toFixed(1)}°C`;
  };

  if (!pigeonId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>健康检查记录</CardTitle>
          <CardDescription>选择一个鸽子来查看其健康检查记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>请先选择一个鸽子</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Activity className="h-6 w-6 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-sm text-gray-500">加载健康检查记录...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-red-600">
            <p>加载健康检查记录失败</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>健康检查记录</CardTitle>
          <CardDescription>
            查看和管理鸽子的健康检查记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="搜索鸽子编号、名称或检查人员..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="健康状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="excellent">优秀</SelectItem>
                <SelectItem value="good">良好</SelectItem>
                <SelectItem value="fair">一般</SelectItem>
                <SelectItem value="poor">较差</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">最近一周</SelectItem>
                <SelectItem value="month">最近一月</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 健康检查列表 */}
          {filteredChecks.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>检查日期</TableHead>
                    <TableHead>鸽子</TableHead>
                    <TableHead>健康状态</TableHead>
                    <TableHead>体重</TableHead>
                    <TableHead>体温</TableHead>
                    <TableHead>检查人员</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecks.map((check) => {
                    const pigeon = getPigeonInfo(check.pigeon_id);
                    return (
                      <TableRow key={check.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(check.check_date), 'yyyy-MM-dd')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pigeon?.band_number}</div>
                            {pigeon?.name && (
                              <div className="text-sm text-muted-foreground">{pigeon.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getHealthConditionColor(check.condition)}>
                            {check.condition === 'excellent' ? '优秀' :
                             check.condition === 'good' ? '良好' :
                             check.condition === 'fair' ? '一般' : '较差'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatWeight(check.weight)}
                        </TableCell>
                        <TableCell>
                          {formatTemperature(check.temperature)}
                        </TableCell>
                        <TableCell>
                          {check.examiner || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCheck(check);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCheck(check);
                                // TODO: Implement edit functionality
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => check.id && handleDelete(check.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p>没有找到健康检查记录</p>
              <p className="text-sm">尝试调整搜索条件或添加新的健康检查</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 健康检查详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>健康检查详情</DialogTitle>
            <DialogDescription>
              查看完整的健康检查信息
            </DialogDescription>
          </DialogHeader>
          {selectedCheck && (
            <ScrollArea className="max-h-[80vh]">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">基本信息</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">鸽子编号:</span>
                      <span>{getPigeonInfo(selectedCheck.pigeon_id)?.band_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">鸽子名称:</span>
                      <span>{getPigeonInfo(selectedCheck.pigeon_id)?.name || '未命名'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">检查日期:</span>
                      <span>{format(new Date(selectedCheck.check_date), 'yyyy年MM月dd日')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">健康状态:</span>
                      <Badge className={getHealthConditionColor(selectedCheck.condition)}>
                        {selectedCheck.condition === 'excellent' ? '优秀' :
                         selectedCheck.condition === 'good' ? '良好' :
                         selectedCheck.condition === 'fair' ? '一般' : '较差'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">检查人员:</span>
                      <span>{selectedCheck.examiner || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 生理指标 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">生理指标</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">体重:</span>
                      <span>{formatWeight(selectedCheck.weight)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">体温:</span>
                      <span>{formatTemperature(selectedCheck.temperature)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">呼吸频率:</span>
                      <span>{selectedCheck.respiratory_rate || '-'} 次/分钟</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">心率:</span>
                      <span>{selectedCheck.heart_rate || '-'} 次/分钟</span>
                    </div>
                  </div>
                </div>

                {/* 身体部位检查 */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-medium text-lg">身体部位检查</h3>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">羽毛状况:</span>
                      <span>{selectedCheck.feathers_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">眼睛状况:</span>
                      <span>{selectedCheck.eyes_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">鼻孔状况:</span>
                      <span>{selectedCheck.nose_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">口腔状况:</span>
                      <span>{selectedCheck.mouth_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">嗉囊状况:</span>
                      <span>{selectedCheck.crop_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">肛门状况:</span>
                      <span>{selectedCheck.vent_condition || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">脚部状况:</span>
                      <span>{selectedCheck.feet_condition || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 备注 */}
                {selectedCheck.notes && (
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="font-medium text-lg">备注</h3>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                      {selectedCheck.notes}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HealthCheckList;