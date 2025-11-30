import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateHealthCheck, HealthCheckInput } from '@/hooks/useHealth';
import { usePigeons } from '@/hooks/usePigeons';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckFormProps {
  pigeonId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const healthConditions = [
  { value: 'excellent', label: '优秀', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: '良好', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: '一般', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: '较差', color: 'bg-red-100 text-red-800' },
];

const conditionOptions = [
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
];

export function HealthCheckForm({ pigeonId, onSuccess, onCancel }: HealthCheckFormProps) {
  const [formData, setFormData] = useState<Partial<HealthCheckInput>>({
    pigeon_id: pigeonId || 0,
    check_date: format(new Date(), 'yyyy-MM-dd'),
    condition: 'good',
  });

  const [selectedPigeon, setSelectedPigeon] = useState<string>('');
  const { data: pigeons } = usePigeons();
  const createHealthCheck = useCreateHealthCheck();
  const { toast } = useToast();

  useEffect(() => {
    if (pigeonId && pigeons) {
      const pigeon = pigeons.find(p => p.id === pigeonId);
      if (pigeon) {
        setSelectedPigeon(`${pigeon.id}`);
        setFormData(prev => ({ ...prev, pigeon_id: pigeonId }));
      }
    }
  }, [pigeonId, pigeons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pigeon_id || !formData.condition) {
      toast({
        title: '验证错误',
        description: '请选择鸽子并填写健康状态',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createHealthCheck.mutateAsync(formData as HealthCheckInput);
      toast({
        title: '成功',
        description: '健康检查记录已创建',
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: '错误',
        description: '创建健康检查记录失败',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: keyof HealthCheckInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePigeonSelect = (value: string) => {
    setSelectedPigeon(value);
    setFormData(prev => ({ ...prev, pigeon_id: parseInt(value) }));
  };

  const selectedPigeonData = pigeons?.find(p => p.id === parseInt(selectedPigeon));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pigeon">鸽子</Label>
          {pigeonId ? (
            <div className="p-3 border rounded-lg bg-gray-50">
              <p className="font-medium">{selectedPigeonData?.ring_number}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPigeonData?.name || '未命名'}
              </p>
            </div>
          ) : (
            <Select value={selectedPigeon} onValueChange={handlePigeonSelect}>
              <SelectTrigger>
                <SelectValue placeholder="选择鸽子" />
              </SelectTrigger>
              <SelectContent>
                {pigeons?.map((pigeon) => (
                  <SelectItem key={pigeon.id} value={pigeon.id.toString()}>
                    {pigeon.ring_number} - {pigeon.name || '未命名'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_date">检查日期</Label>
          <Input
            id="check_date"
            type="date"
            value={formData.check_date}
            onChange={(e) => handleInputChange('check_date', e.target.value)}
            required
          />
        </div>
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
            onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
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
            onChange={(e) => handleInputChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="respiratory_rate">呼吸频率 (次/分钟)</Label>
          <Input
            id="respiratory_rate"
            type="number"
            placeholder="输入呼吸频率"
            value={formData.respiratory_rate || ''}
            onChange={(e) => handleInputChange('respiratory_rate', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heart_rate">心率 (次/分钟)</Label>
          <Input
            id="heart_rate"
            type="number"
            placeholder="输入心率"
            value={formData.heart_rate || ''}
            onChange={(e) => handleInputChange('heart_rate', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">健康状态</Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => handleInputChange('condition', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择健康状态" />
          </SelectTrigger>
          <SelectContent>
            {conditionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Badge className={healthConditions.find(c => c.value === option.value)?.color}>
                    {option.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">详细检查</h3>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="feathers_condition">羽毛状况</Label>
            <Select
              value={formData.feathers_condition || ''}
              onValueChange={(value) => handleInputChange('feathers_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择羽毛状况" />
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
            <Label htmlFor="eyes_condition">眼睛状况</Label>
            <Select
              value={formData.eyes_condition || ''}
              onValueChange={(value) => handleInputChange('eyes_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择眼睛状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">清澈</SelectItem>
                <SelectItem value="cloudy">浑浊</SelectItem>
                <SelectItem value="discharge">分泌物</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nose_condition">鼻孔状况</Label>
            <Select
              value={formData.nose_condition || ''}
              onValueChange={(value) => handleInputChange('nose_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择鼻孔状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">清晰</SelectItem>
                <SelectItem value="discharge">分泌物</SelectItem>
                <SelectItem value="blocked">堵塞</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mouth_condition">口腔状况</Label>
            <Select
              value={formData.mouth_condition || ''}
              onValueChange={(value) => handleInputChange('mouth_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择口腔状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
                <SelectItem value="lesions">病变</SelectItem>
                <SelectItem value="discoloration">变色</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop_condition">嗉囊状况</Label>
            <Select
              value={formData.crop_condition || ''}
              onValueChange={(value) => handleInputChange('crop_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择嗉囊状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">饱满</SelectItem>
                <SelectItem value="empty">空虚</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
                <SelectItem value="impacted">阻塞</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vent_condition">肛门状况</Label>
            <Select
              value={formData.vent_condition || ''}
              onValueChange={(value) => handleInputChange('vent_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择肛门状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">清洁</SelectItem>
                <SelectItem value="dirty">脏污</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
                <SelectItem value="prolapsed">脱垂</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feet_condition">脚部状况</Label>
            <Select
              value={formData.feet_condition || ''}
              onValueChange={(value) => handleInputChange('feet_condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择脚部状况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="abnormal">异常</SelectItem>
                <SelectItem value="injured">受伤</SelectItem>
                <SelectItem value="swollen">肿胀</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examiner">检查人员</Label>
            <Input
              id="examiner"
              placeholder="输入检查人员姓名"
              value={formData.examiner || ''}
              onChange={(e) => handleInputChange('examiner', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          placeholder="输入检查备注..."
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={createHealthCheck.isPending}>
          {createHealthCheck.isPending ? '保存中...' : '保存检查记录'}
        </Button>
      </div>
    </form>
  );
}

export default HealthCheckForm;