import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Users,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Eye,
  Calculator
} from 'lucide-react';
import {
  useRelationship,
  useMatingAnalysis,
  formatRelationshipType,
  formatInbreedingRisk,
  getRelationshipColor
} from '@/hooks/usePedigree';
import { usePigeons } from '@/hooks/usePigeons';
import type { RelationshipResult, AdvancedRelationshipAnalysis } from '@/hooks/usePedigree';

interface RelationshipViewerProps {
  className?: string;
}

interface PigeonSelectorProps {
  value?: number;
  onValueChange: (value: number) => void;
  excludeId?: number;
  placeholder: string;
}

const PigeonSelector: React.FC<PigeonSelectorProps> = ({
  value,
  onValueChange,
  excludeId,
  placeholder
}) => {
  const { data: pigeons } = usePigeons();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPigeons = pigeons?.filter(pigeon => {
    const notExcluded = pigeon.id !== excludeId;
    const matchesSearch = searchTerm === '' ||
      pigeon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pigeon.ring_number.toLowerCase().includes(searchTerm.toLowerCase());
    return notExcluded && matchesSearch;
  }) || [];

  return (
    <Select value={value?.toString()} onValueChange={(val) => onValueChange(parseInt(val))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredPigeons.map((pigeon) => (
          <SelectItem key={pigeon.id} value={pigeon.id.toString()}>
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={pigeon.image_path} />
                <AvatarFallback>
                  <Users className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {pigeon.name || `${pigeon.ring_number}`}
                </div>
                <div className="text-xs text-gray-500">
                  {pigeon.ring_number} • {pigeon.year}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const RelationshipViewer: React.FC<RelationshipViewerProps> = ({
  className = ''
}) => {
  const [pigeon1Id, setPigeon1Id] = useState<number>();
  const [pigeon2Id, setPigeon2Id] = useState<number>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: basicRelationship, isLoading: isLoadingBasic } = useRelationship(
    pigeon1Id || 0,
    pigeon2Id || 0
  );

  const {
    basicRelationship: matingRelationship,
    advancedRelationship,
    isLoading: isLoadingAdvanced
  } = useMatingAnalysis(pigeon1Id || 0, pigeon2Id || 0);

  const isLoading = isLoadingBasic || isLoadingAdvanced;
  const relationship = basicRelationship || matingRelationship;

  // 获取两只鸽子信息
  const { data: pigeons } = usePigeons();
  const pigeon1 = pigeons?.find(p => p.id === pigeon1Id);
  const pigeon2 = pigeons?.find(p => p.id === pigeon2Id);

  const handleAnalyze = () => {
    if (pigeon1Id && pigeon2Id) {
      setShowAdvanced(true);
    }
  };

  const handleSwap = () => {
    setPigeon1Id(pigeon2Id);
    setPigeon2Id(pigeon1Id);
  };

  const getRelationshipColorClass = (type: string) => {
    switch (type) {
      case 'sire':
      case 'dam':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sibling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'half-sibling':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'grandparent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 鸽子选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            亲缘关系分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">第一只鸽子</label>
              <PigeonSelector
                value={pigeon1Id}
                onValueChange={setPigeon1Id}
                excludeId={pigeon2Id}
                placeholder="选择第一只鸽子"
              />
              {pigeon1 && (
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  {pigeon1.name || pigeon1.ring_number} • {pigeon1.year}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                disabled={!pigeon1Id || !pigeon2Id}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-500">交换</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">第二只鸽子</label>
              <PigeonSelector
                value={pigeon2Id}
                onValueChange={setPigeon2Id}
                excludeId={pigeon1Id}
                placeholder="选择第二只鸽子"
              />
              {pigeon2 && (
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  {pigeon2.name || pigeon2.ring_number} • {pigeon2.year}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={!pigeon1Id || !pigeon2Id || isLoading}
            >
              <Calculator className="w-4 h-4 mr-2" />
              分析亲缘关系
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {relationship && (
        <>
          {/* 基本关系信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                基本关系分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 关系类型 */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">关系类型：</span>
                  <Badge className={getRelationshipColorClass(relationship.relationship_type)}>
                    {formatRelationshipType(relationship.relationship_type)}
                  </Badge>
                </div>

                {/* 关系描述 */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    {relationship.relationship_description}
                  </AlertDescription>
                </Alert>

                {/* 血缘距离 */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">血缘距离：</span>
                  <Badge variant="outline">
                    {relationship.distance} 代
                  </Badge>
                </div>

                {/* 共同祖先 */}
                {relationship.common_ancestors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">共同祖先 ({relationship.common_ancestors.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {relationship.common_ancestors.map((ancestor) => (
                        <Card key={ancestor.id} className="p-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={''} />
                              <AvatarFallback>
                                <Users className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {ancestor.name || `${ancestor.ring_number}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ancestor.ring_number} • {ancestor.year}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {relationship.common_ancestors.length === 0 && (
                  <Alert>
                    <GitBranch className="w-4 h-4" />
                    <AlertDescription>
                      这两只鸽子没有发现共同祖先
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 高级分析 */}
          {showAdvanced && advancedRelationship?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  高级配对分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 亲缘系数 */}
                    <div>
                      <h4 className="font-medium mb-2">亲缘系数</h4>
                      <div className="text-3xl font-bold"
                           style={{ color: getRelationshipColor(advancedRelationship.data.relationship_coefficient) }}>
                        {(advancedRelationship.data.relationship_coefficient * 100).toFixed(2)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        基于共同祖先计算的血缘关系强度
                      </p>
                    </div>

                    {/* 近交风险 */}
                    <div>
                      <h4 className="font-medium mb-2">近交风险</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${formatInbreedingRisk(advancedRelationship.data.inbreeding_risk).color}`}>
                          {formatInbreedingRisk(advancedRelationship.data.inbreeding_risk).text}
                        </span>
                        {advancedRelationship.data.inbreeding_risk === 'High' && (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        {advancedRelationship.data.inbreeding_risk === 'Low' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 繁殖建议 */}
                  <div>
                    <h4 className="font-medium mb-3">繁殖建议</h4>
                    <Alert className={advancedRelationship.data.inbreeding_risk === 'High' ? 'border-red-200' : ''}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        {advancedRelationship.data.breeding_recommendation}
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* 关系统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {advancedRelationship.data.common_ancestors.length}
                        </div>
                        <div className="text-sm text-gray-600">共同祖先</div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {relationship.distance}
                        </div>
                        <div className="text-sm text-gray-600">血缘距离</div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatRelationshipType(advancedRelationship.data.relationship_type)}
                        </div>
                        <div className="text-sm text-gray-600">关系类型</div>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500">正在分析亲缘关系...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {!pigeon1Id && !pigeon2Id && !isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>请选择两只鸽子来分析它们的亲缘关系</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelationshipViewer;