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
import { Plus, Pill, Calendar, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTreatments, useCreateTreatment, getTreatmentStatusColor, useDiseaseTypes, useMedicationTypes } from '@/hooks/useHealth';
import { usePigeons } from '@/hooks/usePigeons';
import { useToast } from '@/hooks/use-toast';

export function TreatmentManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPigeonId, setSelectedPigeonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('ongoing');

  const { data: ongoingTreatments } = useTreatments(selectedPigeonId || 0, 'ongoing', {
    enabled: !!selectedPigeonId,
  });
  const { data: completedTreatments } = useTreatments(selectedPigeonId || 0, 'completed', {
    enabled: !!selectedPigeonId,
  });
  const { data: discontinuedTreatments } = useTreatments(selectedPigeonId || 0, 'discontinued', {
    enabled: !!selectedPigeonId,
  });
  const { data: diseaseTypes } = useDiseaseTypes();
  const { data: medicationTypes } = useMedicationTypes();
  const { data: pigeons } = usePigeons();
  const createTreatment = useCreateTreatment();
  const { toast } = useToast();

  const currentTreatments = activeTab === 'ongoing' ? ongoingTreatments :
                           activeTab === 'completed' ? completedTreatments :
                           discontinuedTreatments;

  const getDiseaseTypeName = (diseaseTypeId: number) => {
    return diseaseTypes?.find(dt => dt.id === diseaseTypeId)?.name;
  };

  const getMedicationTypeName = (medicationTypeId: number) => {
    return medicationTypes?.find(mt => mt.id === medicationTypeId)?.name;
  };

  const getPigeonInfo = (pigeonId: number) => {
    return pigeons?.find(p => p.id === pigeonId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'discontinued':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateTreatmentDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>治疗管理</CardTitle>
              <CardDescription>
                管理鸽子的治疗记录和药物使用情况
              </CardDescription>
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
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加治疗记录
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加治疗记录</DialogTitle>
                    <DialogDescription>
                      记录新的治疗信息
                    </DialogDescription>
                  </DialogHeader>
                  <TreatmentForm
                    onSuccess={() => {
                      setShowAddForm(false);
                      toast({
                        title: '成功',
                        description: '治疗记录已添加',
                      });
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPigeonId ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="ongoing">
                  进行中 ({ongoingTreatments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  已完成 ({completedTreatments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="discontinued">
                  已停止 ({discontinuedTreatments?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {currentTreatments && currentTreatments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>疾病</TableHead>
                          <TableHead>药物</TableHead>
                          <TableHead>诊断日期</TableHead>
                          <TableHead>开始日期</TableHead>
                          <TableHead>治疗时长</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>兽医</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTreatments.map((treatment) => (
                          <TableRow key={treatment.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <div>
                                  <div className="font-medium">
                                    {treatment.disease_type_id
                                      ? getDiseaseTypeName(treatment.disease_type_id)
                                      : treatment.diagnosis || '未知疾病'
                                    }
                                  </div>
                                  {treatment.symptoms && (
                                    <div className="text-xs text-muted-foreground">
                                      {treatment.symptoms}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">
                                    {treatment.medication_type_id
                                      ? getMedicationTypeName(treatment.medication_type_id)
                                      : treatment.medication_name || '未知药物'
                                    }
                                  </div>
                                  {treatment.dosage && (
                                    <div className="text-xs text-muted-foreground">
                                      {treatment.dosage} {treatment.frequency || ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {format(new Date(treatment.diagnosis_date), 'yyyy-MM-dd')}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(treatment.start_date), 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell>
                              {calculateTreatmentDuration(treatment.start_date, treatment.end_date)} 天
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(treatment.status)}
                                <Badge className={getTreatmentStatusColor(treatment.status)}>
                                  {treatment.status === 'ongoing' ? '进行中' :
                                   treatment.status === 'completed' ? '已完成' : '已停止'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {treatment.veterinarian || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-8 w-8 mx-auto mb-2" />
                    <p>
                      {activeTab === 'ongoing' ? '没有进行中的治疗' :
                       activeTab === 'completed' ? '没有已完成的治疗' : '没有已停止的治疗'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-8 w-8 mx-auto mb-2" />
              <p>请选择一个鸽子查看治疗记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TreatmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function TreatmentForm({ onSuccess, onCancel }: TreatmentFormProps) {
  const [formData, setFormData] = useState({
    pigeon_id: 0,
    disease_type_id: 0,
    medication_type_id: 0,
    diagnosis_date: format(new Date(), 'yyyy-MM-dd'),
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    status: 'ongoing',
    symptoms: '',
    diagnosis: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    administration_route: '',
    duration_days: 0,
    response_to_treatment: '',
    side_effects: '',
    follow_up_required: false,
    follow_up_date: '',
    veterinarian: '',
    cost: 0,
    notes: '',
  });

  const { data: pigeons } = usePigeons();
  const { data: diseaseTypes } = useDiseaseTypes();
  const { data: medicationTypes } = useMedicationTypes();
  const createTreatment = useCreateTreatment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pigeon_id || !formData.diagnosis_date || !formData.start_date) {
      return;
    }

    try {
      await createTreatment.mutateAsync({
        pigeon_id: formData.pigeon_id,
        disease_type_id: formData.disease_type_id || undefined,
        medication_type_id: formData.medication_type_id || undefined,
        diagnosis_date: formData.diagnosis_date,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        status: formData.status,
        symptoms: formData.symptoms || undefined,
        diagnosis: formData.diagnosis || undefined,
        medication_name: formData.medication_name || undefined,
        dosage: formData.dosage || undefined,
        frequency: formData.frequency || undefined,
        administration_route: formData.administration_route || undefined,
        duration_days: formData.duration_days || undefined,
        response_to_treatment: formData.response_to_treatment || undefined,
        side_effects: formData.side_effects || undefined,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date || undefined,
        veterinarian: formData.veterinarian || undefined,
        cost: formData.cost || undefined,
        notes: formData.notes || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create treatment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>鸽子</Label>
          <Select value={formData.pigeon_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, pigeon_id: parseInt(value) }))}>
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
        </div>

        <div className="space-y-2">
          <Label>疾病类型</Label>
          <Select value={formData.disease_type_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, disease_type_id: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue placeholder="选择疾病类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">其他</SelectItem>
              {diseaseTypes?.map((disease) => (
                <SelectItem key={disease.id} value={disease.id.toString()}>
                  {disease.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>诊断日期</Label>
          <Input
            type="date"
            value={formData.diagnosis_date}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnosis_date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>开始日期</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>结束日期</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>状态</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">进行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="discontinued">已停止</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>治疗时长 (天)</Label>
          <Input
            type="number"
            value={formData.duration_days}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>症状</Label>
        <Textarea
          value={formData.symptoms}
          onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
          placeholder="描述症状..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>诊断</Label>
        <Textarea
          value={formData.diagnosis}
          onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
          placeholder="诊断结果..."
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>药物类型</Label>
          <Select value={formData.medication_type_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, medication_type_id: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue placeholder="选择药物类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">其他</SelectItem>
              {medicationTypes?.map((medication) => (
                <SelectItem key={medication.id} value={medication.id.toString()}>
                  {medication.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>药物名称</Label>
          <Input
            value={formData.medication_name}
            onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
            placeholder="输入药物名称"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>剂量</Label>
          <Input
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
            placeholder="输入剂量"
          />
        </div>

        <div className="space-y-2">
          <Label>频率</Label>
          <Input
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
            placeholder="如：每天两次"
          />
        </div>

        <div className="space-y-2">
          <Label>给药途径</Label>
          <Input
            value={formData.administration_route}
            onChange={(e) => setFormData(prev => ({ ...prev, administration_route: e.target.value }))}
            placeholder="如：口服、注射"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>治疗反应</Label>
        <Select value={formData.response_to_treatment} onValueChange={(value) => setFormData(prev => ({ ...prev, response_to_treatment: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="选择治疗反应" />
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
        <Label>副作用</Label>
        <Textarea
          value={formData.side_effects}
          onChange={(e) => setFormData(prev => ({ ...prev, side_effects: e.target.value }))}
          placeholder="描述任何副作用..."
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>兽医</Label>
          <Input
            value={formData.veterinarian}
            onChange={(e) => setFormData(prev => ({ ...prev, veterinarian: e.target.value }))}
            placeholder="输入兽医姓名"
          />
        </div>

        <div className="space-y-2">
          <Label>费用</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="输入备注信息..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={createTreatment.isPending}>
          {createTreatment.isPending ? '保存中...' : '保存治疗记录'}
        </Button>
      </div>
    </form>
  );
}

export default TreatmentManager;