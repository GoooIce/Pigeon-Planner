import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Plus, Calendar, User, Eye, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  useSimpleHealthChecks,
  useCreateSimpleHealthCheck,
  useDeleteSimpleHealthCheck,
  useSimpleHealthSummary,
  getHealthConditionColor,
  SimpleHealthCheck,
  SimpleHealthSummary
} from '@/hooks/useHealthSimple';
import { usePigeons } from '@/hooks/usePigeons';
import { toast } from 'sonner';

export function HealthDashboardSimple() {
  const [selectedPigeonId, setSelectedPigeonId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: healthSummary } = useSimpleHealthSummary();
  const { data: healthChecks } = useSimpleHealthChecks(selectedPigeonId || 0, {
    enabled: !!selectedPigeonId,
  });
  const { data: pigeons } = usePigeons();
  const createHealthCheck = useCreateSimpleHealthCheck();
  const deleteHealthCheck = useDeleteSimpleHealthCheck();
  // 使用sonner toast

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
    return pigeons?.find(p => p.id === pigeonId);
  };

  if (!healthSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">加载健康数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">健康管理 (演示版)</h1>
          <p className="text-muted-foreground">
            监控和管理鸽子的健康状况和检查记录
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPigeonId?.toString() || ''} onValueChange={(value) => setSelectedPigeonId(value ? parseInt(value) : null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择鸽子" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">所有鸽子</SelectItem>
              {pigeons?.map((pigeon) => (
                <SelectItem key={pigeon.id} value={pigeon.id.toString()}>
                  {pigeon.ring_number} - {pigeon.name || '未命名'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild disabled={!selectedPigeonId}>
              <Button disabled={!selectedPigeonId}>
                <Plus className="h-4 w-4 mr-2" />
                添加健康检查
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加健康检查记录</DialogTitle>
                <DialogDescription>
                  记录鸽子的健康状况和检查结果
                </DialogDescription>
              </DialogHeader>
              <HealthCheckFormSimple
                pigeonId={selectedPigeonId!}
                onSuccess={() => {
                  setShowAddForm(false);
                  toast({
                    title: '成功',
                    description: '健康检查记录已创建',
                  });
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="health-checks">健康检查</TabsTrigger>
          <TabsTrigger value="statistics">统计</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 健康概览卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总鸽数</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthSummary.total_pigeons}</div>
                <p className="text-xs text-muted-foreground">
                  已录入的鸽子总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">有检查记录</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthSummary.healthy_pigeons}</div>
                <p className="text-xs text-muted-foreground">
                  有健康检查记录的鸽子
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">疫苗接种</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthSummary.total_vaccinations}</div>
                <p className="text-xs text-muted-foreground">
                  疫苗接种记录总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">近期检查</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthSummary.recent_health_checks}</div>
                <p className="text-xs text-muted-foreground">
                  最近7天完成的检查
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health-checks" className="space-y-6">
          {selectedPigeonId && healthChecks && healthChecks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>健康检查记录</CardTitle>
                <CardDescription>
                  {getPigeonInfo(selectedPigeonId)?.ring_number} - {getPigeonInfo(selectedPigeonId)?.name || '未命名'} 的检查记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>检查日期</TableHead>
                        <TableHead>健康状态</TableHead>
                        <TableHead>体重</TableHead>
                        <TableHead>体温</TableHead>
                        <TableHead>检查人员</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthChecks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {format(new Date(check.check_date), 'yyyy-MM-dd')}
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
                            {check.weight ? `${check.weight.toFixed(1)} g` : '-'}
                          </TableCell>
                          <TableCell>
                            {check.temperature ? `${check.temperature.toFixed(1)}°C` : '-'}
                          </TableCell>
                          <TableCell>
                            {check.examiner || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : selectedPigeonId ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>该鸽子没有健康检查记录</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>请选择一个鸽子查看健康检查记录</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>健康统计</CardTitle>
              <CardDescription>
                鸽群健康状况的整体统计信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">演示版本</h3>
                <p>详细的统计分析功能将在完整版本中实现</p>
                <p className="text-sm mt-2">当前版本包含基础的健康检查记录功能</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface HealthCheckFormSimpleProps {
  pigeonId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function HealthCheckFormSimple({ pigeonId, onSuccess, onCancel }: HealthCheckFormSimpleProps) {
  const [formData, setFormData] = useState({
    pigeon_id: pigeonId,
    check_date: format(new Date(), 'yyyy-MM-dd'),
    weight: 0,
    temperature: 0,
    condition: 'good',
    notes: '',
    examiner: '',
  });

  const createHealthCheck = useCreateSimpleHealthCheck();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createHealthCheck.mutateAsync(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create health check:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="check_date">检查日期</Label>
        <Input
          id="check_date"
          type="date"
          value={formData.check_date}
          onChange={(e) => setFormData(prev => ({ ...prev, check_date: e.target.value }))}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight">体重 (克)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="输入体重"
            value={formData.weight || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : 0 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">体温 (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            placeholder="输入体温"
            value={formData.temperature || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value ? parseFloat(e.target.value) : 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">健康状态</Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择健康状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">优秀</SelectItem>
            <SelectItem value="good">良好</SelectItem>
            <SelectItem value="fair">一般</SelectItem>
            <SelectItem value="poor">较差</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="examiner">检查人员</Label>
        <Input
          id="examiner"
          placeholder="输入检查人员姓名"
          value={formData.examiner}
          onChange={(e) => setFormData(prev => ({ ...prev, examiner: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          placeholder="输入检查备注..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={createHealthCheck.isPending}>
          {createHealthCheck.isPending ? '保存中...' : '保存检查记录'}
        </Button>
      </div>
    </form>
  );
}

export default HealthDashboardSimple;