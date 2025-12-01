import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Activity, Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useHealthStatistics, useHealthSummary } from '@/hooks/useHealth';
import { usePigeons } from '@/hooks/usePigeons';
import { toast } from 'sonner';

export function HealthStatistics() {
  const [selectedPigeonId, setSelectedPigeonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: healthSummary } = useHealthSummary();
  const { data: healthStatistics } = useHealthStatistics();
  const { data: pigeons } = usePigeons();
  // 使用sonner toast

  const filteredStatistics = selectedPigeonId
    ? healthStatistics?.filter(stat => stat.pigeon_id === selectedPigeonId)
    : healthStatistics;

  const getHealthRate = () => {
    if (!healthSummary) return 0;
    const total = healthSummary.total_pigeons;
    const healthy = healthSummary.healthy_pigeons;
    return total > 0 ? (healthy / total) * 100 : 0;
  };

  const getVaccinationRate = () => {
    if (!healthSummary) return 0;
    const total = healthSummary.total_pigeons;
    const vaccinated = healthSummary.total_pigeons - healthSummary.overdue_vaccinations;
    return total > 0 ? (vaccinated / total) * 100 : 0;
  };

  const getTreatmentRate = () => {
    if (!healthSummary) return 0;
    const total = healthSummary.total_pigeons;
    const beingTreated = healthSummary.ongoing_treatments;
    return total > 0 ? (beingTreated / total) * 100 : 0;
  };

  const exportData = () => {
    // TODO: Implement export functionality
    toast({
      title: '导出功能',
      description: '数据导出功能将在后续版本中实现',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">健康统计</h2>
          <p className="text-muted-foreground">
            分析鸽子的健康状况和统计数据
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPigeonId?.toString() || ''} onValueChange={(value) => setSelectedPigeonId(value ? parseInt(value) : null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="筛选鸽子" />
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
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="health-checks">健康检查</TabsTrigger>
          <TabsTrigger value="vaccinations">疫苗接种</TabsTrigger>
          <TabsTrigger value="treatments">治疗统计</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 健康概览卡片 */}
          {healthSummary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">健康率</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getHealthRate().toFixed(1)}%</div>
                  <Progress value={getHealthRate()} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {healthSummary.healthy_pigeons} / {healthSummary.total_pigeons} 只健康
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">疫苗接种率</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getVaccinationRate().toFixed(1)}%</div>
                  <Progress value={getVaccinationRate()} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {healthSummary.total_pigeons - healthSummary.overdue_vaccinations} / {healthSummary.total_pigeons} 只已接种
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">治疗中</CardTitle>
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTreatmentRate().toFixed(1)}%</div>
                  <Progress value={getTreatmentRate()} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {healthSummary.ongoing_treatments} 只正在治疗
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">近期检查</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthSummary.recent_health_checks}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    最近7天完成检查
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 统计图表 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>健康状态分布</CardTitle>
                <CardDescription>
                  鸽子健康状态的整体分布情况
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthSummary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">健康</span>
                      <span className="text-sm text-muted-foreground">
                        {healthSummary.healthy_pigeons} 只
                      </span>
                    </div>
                    <Progress
                      value={healthSummary.total_pigeons > 0 ? (healthSummary.healthy_pigeons / healthSummary.total_pigeons) * 100 : 0}
                      className="h-2"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">生病</span>
                      <span className="text-sm text-muted-foreground">
                        {healthSummary.sick_pigeons} 只
                      </span>
                    </div>
                    <Progress
                      value={healthSummary.total_pigeons > 0 ? (healthSummary.sick_pigeons / healthSummary.total_pigeons) * 100 : 0}
                      className="h-2 bg-red-100"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>暂无健康数据</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>疫苗提醒</CardTitle>
                <CardDescription>
                  疫苗接种的提醒统计
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthSummary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">已过期</span>
                      <Badge className="bg-red-100 text-red-800">
                        {healthSummary.overdue_vaccinations} 只
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">即将到期</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {healthSummary.vaccinations_due_this_week} 只
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">待处理提醒</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {healthSummary.pending_reminders} 项
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>暂无疫苗数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health-checks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>健康检查统计</CardTitle>
              <CardDescription>
                每只鸽子的健康检查记录统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStatistics && filteredStatistics.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>鸽子</TableHead>
                        <TableHead>检查次数</TableHead>
                        <TableHead>最后检查</TableHead>
                        <TableHead>平均体重</TableHead>
                        <TableHead>疫苗接种</TableHead>
                        <TableHead>治疗记录</TableHead>
                        <TableHead>待处理提醒</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStatistics.map((stat) => (
                        <TableRow key={stat.pigeon_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{stat.ring_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {stat.pigeon_name || '未命名'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              {stat.total_health_checks}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stat.last_check_date
                              ? format(new Date(stat.last_check_date), 'yyyy-MM-dd')
                              : '未检查'
                            }
                          </TableCell>
                          <TableCell>
                            {stat.avg_weight ? `${stat.avg_weight.toFixed(1)} g` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              {stat.total_vaccinations}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-orange-600" />
                              {stat.total_treatments}
                              {stat.ongoing_treatments > 0 && (
                                <Badge variant="outline" className="text-orange-600">
                                  {stat.ongoing_treatments} 进行中
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stat.pending_reminders > 0 ? (
                              <Badge className="bg-red-100 text-red-800">
                                {stat.pending_reminders} 项
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                无待处理
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>没有找到健康检查统计数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>疫苗接种统计</CardTitle>
              <CardDescription>
                疫苗接种的整体统计信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement detailed vaccination statistics */}
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>详细的疫苗统计功能将在后续版本中实现</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>治疗统计</CardTitle>
              <CardDescription>
                治疗记录的统计分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement detailed treatment statistics */}
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>详细的治疗统计功能将在后续版本中实现</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export both default and named exports for compatibility
export { HealthStatistics as HealthStatisticsView };
export default HealthStatistics;