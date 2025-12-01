import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Users,
  Home,
  BarChart3,
  Plus,
  Search,
  Calendar,
  Egg,
  Bird,
  AlertCircle
} from 'lucide-react'
import {
  useBreedingManagementData,
  formatDate,
  formatPercentage,
  getStatusText,
  getSexText
} from '@/hooks/useBreeding'
import { PairManager } from './PairManager'
import { BreedingRecords } from './BreedingRecords'
import { NestBoxManager } from './NestBoxManager'
import { BreedingStats } from './BreedingStats'

interface BreedingManagerProps {
  className?: string
}

export function BreedingManager({ className }: BreedingManagerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { pairs, stats, availableNestBoxes, isLoading, error } = useBreedingManagementData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载繁殖管理数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>加载失败: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">繁殖管理</h1>
          <p className="text-gray-600">管理鸽子配对、繁殖记录和巢箱分配</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新建配对
          </Button>
        </div>
      </div>

      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总配对数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_pairs || 0}</div>
            <p className="text-xs text-muted-foreground">
              活跃配对: {stats?.active_pairs || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">繁殖窝数</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_clutches || 0}</div>
            <p className="text-xs text-muted-foreground">
              总蛋数: {stats?.total_eggs || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">孵化率</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(stats?.average_hatch_rate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              出飞率: {formatPercentage(stats?.average_fledge_rate || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用巢箱</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.available_nest_boxes || 0}</div>
            <p className="text-xs text-muted-foreground">
              空闲巢箱数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="pairs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            配对管理
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            繁殖记录
          </TabsTrigger>
          <TabsTrigger value="nests" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            巢箱管理
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            统计分析
          </TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近配对 */}
            <Card>
              <CardHeader>
                <CardTitle>最近配对</CardTitle>
                <CardDescription>
                  最近创建或更新的繁殖配对
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pairs.slice(0, 5).map((pair) => (
                    <div key={pair.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {pair.sire_ring_number} × {pair.dam_ring_number}
                          </span>
                          <Badge variant={pair.status === 'active' ? 'default' : 'secondary'}>
                            {getStatusText(pair.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          配对日期: {formatDate(pair.pair_date)}
                          {pair.nest_box_number && (
                            <span className="ml-2">巢箱: {pair.nest_box_number}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>总窝数: {pair.total_clutches}</div>
                        <div>孵化率: {formatPercentage(pair.hatch_rate)}</div>
                      </div>
                    </div>
                  ))}
                  {pairs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      暂无配对记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 繁殖统计 */}
            <Card>
              <CardHeader>
                <CardTitle>繁殖统计</CardTitle>
                <CardDescription>
                  本年度繁殖成果统计
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.current_year_stats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.current_year_stats.new_pairs}
                          </div>
                          <div className="text-sm text-gray-600">新配对</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.current_year_stats.eggs_produced}
                          </div>
                          <div className="text-sm text-gray-600">产蛋数</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {stats.current_year_stats.chicks_hatched}
                          </div>
                          <div className="text-sm text-gray-600">孵化数</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {stats.current_year_stats.chicks_fledged}
                          </div>
                          <div className="text-sm text-gray-600">出飞数</div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span>年度孵化率:</span>
                          <span className="font-medium">
                            {formatPercentage(stats.current_year_stats.hatch_rate)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>年度出飞率:</span>
                          <span className="font-medium">
                            {formatPercentage(stats.current_year_stats.fledge_rate)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      暂无年度统计数据
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最佳表现配对 */}
          {stats?.best_performing_pair && (
            <Card>
              <CardHeader>
                <CardTitle>最佳表现配对</CardTitle>
                <CardDescription>
                  综合表现最优秀的繁殖配对
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                  <div>
                    <div className="text-lg font-semibold">
                      {stats.best_performing_pair.sire_ring_number} × {stats.best_performing_pair.dam_ring_number}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      总窝数: {stats.best_performing_pair.total_clutches} |
                      总蛋数: {stats.best_performing_pair.total_eggs} |
                      孵化率: {formatPercentage(stats.best_performing_pair.hatch_rate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="text-sm">
                      性能评分: {stats.best_performing_pair.performance_score.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 配对管理标签页 */}
        <TabsContent value="pairs" className="space-y-4">
          <PairManager />
        </TabsContent>

        {/* 繁殖记录标签页 */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>繁殖记录</CardTitle>
              <CardDescription>
                选择配对查看详细繁殖记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">请先选择配对</p>
                <p className="text-sm text-gray-500">
                  在配对管理中选择配对后可查看详细繁殖记录
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 巢箱管理标签页 */}
        <TabsContent value="nests" className="space-y-4">
          <NestBoxManager />
        </TabsContent>

        {/* 统计分析标签页 */}
        <TabsContent value="stats" className="space-y-4">
          <BreedingStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}