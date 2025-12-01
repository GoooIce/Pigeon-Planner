import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  ChevronRight,
  User,
  Users,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share
} from 'lucide-react';
import { usePedigree, formatSex, generatePedigreeTreeData } from '@/hooks/usePedigree';
import type { PedigreeTree, PedigreeNode } from '@/hooks/usePedigree';

interface PedigreeTreeProps {
  pigeonId: number;
  maxGenerations?: number;
  className?: string;
}

interface TreeNodeProps {
  node: any;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (node: PedigreeNode) => void;
}

// 递归树节点组件
const TreeNode: React.FC<TreeNodeProps> = ({ node, level, isExpanded, onToggle, onSelect }) => {
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const levelColors = [
    'border-blue-500',   // 第1代 - 蓝色
    'border-green-500',  // 第2代 - 绿色
    'border-yellow-500', // 第3代 - 黄色
    'border-purple-500', // 第4代 - 紫色
    'border-red-500',    // 第5代 - 红色
  ];
  const borderColor = levelColors[Math.min(level, levelColors.length - 1)];

  const getSexIcon = (sex: number) => {
    return sex === 0 ? '♂' : sex === 1 ? '♀' : '?';
  };

  const getSexColor = (sex: number) => {
    return sex === 0 ? 'text-blue-600' : sex === 1 ? 'text-pink-600' : 'text-gray-600';
  };

  return (
    <div className={`${level > 0 ? 'ml-8' : ''}`}>
      <div className={`flex items-center space-x-2 p-3 bg-white border-2 ${borderColor} rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
           onClick={() => onSelect(node)}>

        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* 鸽子头像 */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={''} alt={node.name} />
          <AvatarFallback className="bg-gray-100">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>

        {/* 鸽子信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 truncate">
              {node.name || `${node.ring_number} (${node.year})`}
            </h4>
            <span className={`text-lg font-bold ${getSexColor(node.sex)}`}>
              {getSexIcon(node.sex)}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {node.ring_number}
            </Badge>
            <span className="text-xs text-gray-500">{node.year}年</span>
            {node.strain && (
              <Badge variant="outline" className="text-xs">
                {node.strain}
              </Badge>
            )}
          </div>

          {node.color && (
            <p className="text-xs text-gray-600 mt-1">{node.color}</p>
          )}
        </div>

        {/* 代数标识 */}
        <div className="flex flex-col items-center justify-center text-xs text-gray-500">
          <span>F{level}</span>
          {level === 1 && <span className="text-xs font-medium">本人</span>}
          {level === 2 && <span className="text-xs font-medium">父母</span>}
          {level === 3 && <span className="text-xs font-medium">祖父母</span>}
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child: any, index: number) => (
            <div key={child?.id || index} className="relative">
              {/* 连接线 */}
              <div className="absolute left-0 top-0 w-px h-full bg-gray-300"
                   style={{ left: '-32px' }} />
              {index === 0 && (
                <div className="absolute left-0 w-8 h-px bg-gray-300"
                     style={{ left: '-32px', top: '24px' }} />
              )}

              <TreeNode
                node={child}
                level={level + 1}
                isExpanded={child.isExpanded || false}
                onToggle={() => child.isExpanded = !child.isExpanded}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PedigreeTree: React.FC<PedigreeTreeProps> = ({
  pigeonId,
  maxGenerations = 4,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedNode, setSelectedNode] = useState<PedigreeNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: pedigree, isLoading, error } = usePedigree(pigeonId, maxGenerations);

  // 生成树形数据结构
  const treeData = useMemo(() => {
    if (!pedigree) return null;
    return generatePedigreeTreeData(pedigree);
  }, [pedigree]);

  // 切换节点展开状态
  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // 检查节点是否展开
  const isNodeExpanded = (nodeId: number): boolean => {
    return expandedNodes.has(nodeId);
  };

  // 选择节点
  const handleSelectNode = (node: any) => {
    setSelectedNode(node);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // 导出功能
  const handleExport = () => {
    // TODO: 实现血统树导出功能
    console.log('Export pedigree tree');
  };

  // 分享功能
  const handleShare = () => {
    // TODO: 实现血统树分享功能
    console.log('Share pedigree tree');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-500">正在加载血统树...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <Users className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-700">加载血统树失败</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!treeData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <Users className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-500">没有找到血统信息</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">血统树</h3>
              <Badge variant="outline">{maxGenerations}代</Badge>
            </div>

            <div className="flex items-center space-x-2">
              {/* 缩放控制 */}
              <div className="flex items-center space-x-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2 font-medium">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* 其他操作 */}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-1" />
                分享
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 血统树内容 */}
      <div className="relative">
        <div
          className="overflow-auto p-4 bg-gray-50 rounded-lg border"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <TreeNode
            node={treeData}
            level={0}
            isExpanded={isNodeExpanded(treeData.id)}
            onToggle={() => toggleNode(treeData.id)}
            onSelect={handleSelectNode}
          />
        </div>
      </div>

      {/* 选中节点详情 */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">鸽子详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">环号：</span>
                <span>{selectedNode.ring_number}</span>
              </div>
              <div>
                <span className="font-medium">出生年份：</span>
                <span>{selectedNode.year}</span>
              </div>
              <div>
                <span className="font-medium">性别：</span>
                <span>{formatSex(selectedNode.sex)}</span>
              </div>
              {selectedNode.strain && (
                <div>
                  <span className="font-medium">品种：</span>
                  <span>{selectedNode.strain}</span>
                </div>
              )}
              {selectedNode.color && (
                <div className="col-span-2">
                  <span className="font-medium">羽色：</span>
                  <span>{selectedNode.color}</span>
                </div>
              )}
              {selectedNode.loft && (
                <div className="col-span-2">
                  <span className="font-medium">鸽舍：</span>
                  <span>{selectedNode.loft}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图例 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">图例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span>本人 (F1)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
              <span>父母 (F2)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-yellow-500 rounded"></div>
              <span>祖父母 (F3)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-500 rounded"></div>
              <span>曾祖父母 (F4)</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-bold">♂</span>
              <span className="text-sm">雄性</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-pink-600 font-bold">♀</span>
              <span className="text-sm">雌性</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-bold">?</span>
              <span className="text-sm">未知</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PedigreeTree;