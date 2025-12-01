import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GitBranch,
  Users,
  Heart,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  TrendingUp,
  Database,
  Eye
} from 'lucide-react';
import PedigreeTree from './PedigreeTree';
import PedigreeDetail from './PedigreeDetail';
import RelationshipViewer from './RelationshipViewer';
import { usePigeons } from '@/hooks/usePigeons';

interface PedigreeManagerProps {
  className?: string;
}

export const PedigreeManager: React.FC<PedigreeManagerProps> = ({
  className = ''
}) => {
  const [selectedPigeonId, setSelectedPigeonId] = useState<number>();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const { data: pigeons, isLoading } = usePigeons();

  // 过滤鸽子列表
  const filteredPigeons = pigeons?.filter(pigeon => {
    const matchesSearch = searchTerm === '' ||
      pigeon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.ring_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.strain?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterBy === 'male') return matchesSearch && pigeon.sex === 0;
    if (filterBy === 'female') return matchesSearch && pigeon.sex === 1;
    if (filterBy === 'with_parents') return matchesSearch && (pigeon.sire_id || pigeon.dam_id);
    if (filterBy === 'without_parents') return matchesSearch && !pigeon.sire_id && !pigeon.dam_id;

    return matchesSearch;
  }) || [];

  // 计算统计信息
  const stats = {
    total: pigeons?.length || 0,
    withParents: pigeons?.filter(p => p.sire_id || p.dam_id).length || 0,
    withoutParents: pigeons?.filter(p => !p.sire_id && !p.dam_id).length || 0,
    males: pigeons?.filter(p => p.sex === 0).length || 0,
    females: pigeons?.filter(p => p.sex === 1).length || 0,
  };

  const handlePigeonSelect = (pigeonId: number) => {
    setSelectedPigeonId(pigeonId);
    setActiveTab('pedigree-tree');
  };

  const handleExportData = () => {
    // TODO: 实现数据导出功能
    console.log('Export pedigree data');
  };

  const handleImportData = () => {
    // TODO: 实现数据导入功能
    console.log('Import pedigree data');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">血统管理</h1>
          <p className="text-gray-600">管理鸽子的血统关系和繁殖计划</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleImportData}>
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总数量</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">有血统记录</p>
                <p className="text-2xl font-bold">{stats.withParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">无血统记录</p>
                <p className="text-2xl font-bold">{stats.withoutParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">雄性</p>
                <p className="text-2xl font-bold">{stats.males}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">雌性</p>
                <p className="text-2xl font-bold">{stats.females}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="pedigree-tree">血统树</TabsTrigger>
          <TabsTrigger value="pedigree-detail">血统详情</TabsTrigger>
          <TabsTrigger value="relationship-analysis">关系分析</TabsTrigger>
        </TabsList>

        {/* 概览页面 */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  鸽子列表
                </span>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="搜索鸽子..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="male">雄性</SelectItem>
                      <SelectItem value="female">雌性</SelectItem>
                      <SelectItem value="with_parents">有血统</SelectItem>
                      <SelectItem value="without_parents">无血统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPigeons.map((pigeon) => (
                    <Card
                      key={pigeon.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePigeonSelect(pigeon.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">
                            {pigeon.name || `${pigeon.ring_number}`}
                          </h3>
                          <Badge
                            variant={pigeon.sex === 0 ? 'default' : 'secondary'}
                            className={pigeon.sex === 0 ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                          >
                            {pigeon.sex === 0 ? '雄' : '雌'}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>环号: {pigeon.ring_number}</div>
                          <div>年份: {pigeon.year}</div>
                          {pigeon.strain && <div>品种: {pigeon.strain}</div>}
                          <div className="flex items-center space-x-2">
                            <span>血统:</span>
                            {(pigeon.sire_id || pigeon.dam_id) ? (
                              <Badge variant="outline" className="text-green-600">
                                <GitBranch className="w-3 h-3 mr-1" />
                                有记录
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600">
                                <Eye className="w-3 h-3 mr-1" />
                                无记录
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && filteredPigeons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>没有找到匹配的鸽子</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 血统树页面 */}
        <TabsContent value="pedigree-tree">
          {selectedPigeonId ? (
            <PedigreeTree pigeonId={selectedPigeonId} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-gray-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>请先选择一只鸽子查看血统树</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('overview')}
                  >
                    前往选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 血统详情页面 */}
        <TabsContent value="pedigree-detail">
          {selectedPigeonId ? (
            <PedigreeDetail pigeonId={selectedPigeonId} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>请先选择一只鸽子查看血统详情</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('overview')}
                  >
                    前往选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 关系分析页面 */}
        <TabsContent value="relationship-analysis">
          <RelationshipViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PedigreeManager;