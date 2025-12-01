import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Activity, Syringe, Pill, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  useHealthSummary,
  useHealthStatistics,
  useVaccinationSchedule,
  HealthSummary,
  VaccinationSchedule
} from '@/hooks/useHealth';
import { HealthCheckForm } from './HealthCheckForm';
import { HealthCheckList } from './HealthCheckList';
import { VaccinationManager } from './VaccinationManager';
import { TreatmentManager } from './TreatmentManager';
import { HealthStatistics as HealthStatisticsView } from './HealthStatistics';

export function HealthDashboard() {
  const [selectedPigeonId, setSelectedPigeonId] = useState<number | null>(null);
  const [showHealthCheckForm, setShowHealthCheckForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: healthSummary, isLoading: summaryLoading } = useHealthSummary();
  const { data: vaccinationSchedule } = useVaccinationSchedule();
  const { data: healthStatistics } = useHealthStatistics();

  const getSummaryCardData = (summary: HealthSummary) => [
    {
      title: '总鸽子数量',
      value: summary.total_pigeons,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '健康鸽子',
      value: summary.healthy_pigeons,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '生病鸽子',
      value: summary.sick_pigeons,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '待处理治疗',
      value: summary.ongoing_treatments,
      icon: Pill,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getVaccinationAlerts = () => {
    if (!vaccinationSchedule) return [];

    const overdue = vaccinationSchedule.filter(v => v.status === 'overdue');
    const dueSoon = vaccinationSchedule.filter(v => v.status === 'due_soon');

    return [...overdue, ...dueSoon].slice(0, 5); // Show top 5 alerts
  };

  const getUpcomingVaccinations = () => {
    if (!vaccinationSchedule) return [];
    return vaccinationSchedule
      .filter(v => v.status === 'scheduled')
      .slice(0, 5);
  };

  if (summaryLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">健康管理</h1>
          <p className="text-muted-foreground">
            监控和管理鸽子的健康状况、疫苗接种和治疗方案
          </p>
        </div>
        <Button
          onClick={() => setShowHealthCheckForm(true)}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          健康检查
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="health-checks">健康检查</TabsTrigger>
          <TabsTrigger value="vaccinations">疫苗接种</TabsTrigger>
          <TabsTrigger value="treatments">治疗管理</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {healthSummary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {getSummaryCardData(healthSummary).map((item, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {item.title}
                    </CardTitle>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  疫苗提醒
                </CardTitle>
                <CardDescription>
                  需要立即或即将到期的疫苗接种
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getVaccinationAlerts().length > 0 ? (
                  <div className="space-y-3">
                    {getVaccinationAlerts().map((vaccination, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{vaccination.vaccine_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {vaccination.ring_number} - {vaccination.pigeon_name || '未命名'}
                          </p>
                        </div>
                        <Badge
                          variant={vaccination.status === 'overdue' ? 'destructive' : 'outline'}
                          className={
                            vaccination.status === 'overdue'
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }
                        >
                          {vaccination.status === 'overdue' ? '已过期' : '即将到期'}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      查看所有提醒
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>暂无疫苗提醒</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  即将接种
                </CardTitle>
                <CardDescription>
                  计划中的疫苗接种时间表
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getUpcomingVaccinations().length > 0 ? (
                  <div className="space-y-3">
                    {getUpcomingVaccinations().map((vaccination, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{vaccination.vaccine_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {vaccination.ring_number} - {vaccination.pigeon_name || '未命名'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(vaccination.next_due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vaccination.days_until_due} 天后
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>暂无即将接种的疫苗</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health-checks" className="space-y-6">
          {showHealthCheckForm && (
            <Card>
              <CardHeader>
                <CardTitle>新建健康检查</CardTitle>
                <CardDescription>
                  记录鸽子的健康状况和检查结果
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthCheckForm
                  onSuccess={() => setShowHealthCheckForm(false)}
                  onCancel={() => setShowHealthCheckForm(false)}
                />
              </CardContent>
            </Card>
          )}
          <HealthCheckList />
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-6">
          <VaccinationManager />
        </TabsContent>

        <TabsContent value="treatments" className="space-y-6">
          <TreatmentManager />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <HealthStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HealthDashboard;