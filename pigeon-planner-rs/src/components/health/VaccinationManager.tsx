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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Syringe, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useVaccinations, useCreateVaccination, useVaccinationSchedule, getVaccinationStatusColor, useVaccineTypes } from '@/hooks/useHealth';
import { usePigeons } from '@/hooks/usePigeons';
import { useToast } from '@/hooks/use-toast';

export function VaccinationManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPigeonId, setSelectedPigeonId] = useState<number | null>(null);

  const { data: vaccinations } = useVaccinations(selectedPigeonId || 0, {
    enabled: !!selectedPigeonId,
  });
  const { data: vaccinationSchedule } = useVaccinationSchedule();
  const { data: vaccineTypes } = useVaccineTypes();
  const { data: pigeons } = usePigeons();
  const createVaccination = useCreateVaccination();
  const { toast } = useToast();

  const overdueVaccinations = vaccinationSchedule?.filter(v => v.status === 'overdue') || [];
  const dueSoonVaccinations = vaccinationSchedule?.filter(v => v.status === 'due_soon') || [];

  const getVaccineTypeName = (vaccineTypeId: number) => {
    return vaccineTypes?.find(vt => vt.id === vaccineTypeId)?.name;
  };

  const getPigeonInfo = (pigeonId: number) => {
    return pigeons?.find(p => p.id === pigeonId);
  };

  return (
    <div className="space-y-6">
      {/* 疫苗接种提醒 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              过期疫苗
            </CardTitle>
            <CardDescription>
              需要立即补种的疫苗
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueVaccinations.length > 0 ? (
              <div className="space-y-3">
                {overdueVaccinations.map((vaccination, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                    <div>
                      <p className="font-medium">{vaccination.vaccine_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vaccination.band_number} - {vaccination.pigeon_name || '未命名'}
                      </p>
                      <p className="text-xs text-red-600">
                        过期 {Math.abs(vaccination.days_until_due)} 天
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      过期
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm">没有过期的疫苗</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              即将到期
            </CardTitle>
            <CardDescription>
              7天内需要接种的疫苗
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dueSoonVaccinations.length > 0 ? (
              <div className="space-y-3">
                {dueSoonVaccinations.map((vaccination, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                    <div>
                      <p className="font-medium">{vaccination.vaccine_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vaccination.band_number} - {vaccination.pigeon_name || '未命名'}
                      </p>
                      <p className="text-xs text-yellow-600">
                        {vaccination.days_until_due} 天后到期
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      即将到期
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm">没有即将到期的疫苗</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 疫苗接种管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>疫苗接种管理</CardTitle>
              <CardDescription>
                管理鸽子的疫苗接种记录
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
                      {pigeon.band_number} - {pigeon.name || '未命名'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加疫苗接种
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加疫苗接种记录</DialogTitle>
                    <DialogDescription>
                      记录新的疫苗接种信息
                    </DialogDescription>
                  </DialogHeader>
                  <VaccinationForm
                    onSuccess={() => {
                      setShowAddForm(false);
                      toast({
                        title: '成功',
                        description: '疫苗接种记录已添加',
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
          {selectedPigeonId && vaccinations && vaccinations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>疫苗名称</TableHead>
                    <TableHead>接种日期</TableHead>
                    <TableHead>下次接种</TableHead>
                    <TableHead>批次号</TableHead>
                    <TableHead>兽医</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinations.map((vaccination) => (
                    <TableRow key={vaccination.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Syringe className="h-4 w-4 text-blue-600" />
                          {getVaccineTypeName(vaccination.vaccine_type_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(vaccination.vaccination_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        {vaccination.next_due_date
                          ? format(new Date(vaccination.next_due_date), 'yyyy-MM-dd')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {vaccination.batch_number || '-'}
                      </TableCell>
                      <TableCell>
                        {vaccination.veterinarian || '-'}
                      </TableCell>
                      <TableCell>
                        {vaccination.next_due_date ? (
                          (() => {
                            const daysUntil = Math.ceil(
                              (new Date(vaccination.next_due_date!).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                            );
                            const status = daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'due_soon' : 'scheduled';
                            return (
                              <Badge className={getVaccinationStatusColor(status)}>
                                {status === 'overdue' ? '已过期' :
                                 status === 'due_soon' ? '即将到期' : '已安排'}
                              </Badge>
                            );
                          })()
                        ) : (
                          <Badge variant="secondary">无需接种</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : selectedPigeonId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Syringe className="h-8 w-8 mx-auto mb-2" />
              <p>该鸽子没有疫苗接种记录</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Syringe className="h-8 w-8 mx-auto mb-2" />
              <p>请选择一个鸽子查看疫苗接种记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface VaccinationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function VaccinationForm({ onSuccess, onCancel }: VaccinationFormProps) {
  const [formData, setFormData] = useState({
    pigeon_id: 0,
    vaccine_type_id: 0,
    vaccination_date: format(new Date(), 'yyyy-MM-dd'),
    next_due_date: '',
    batch_number: '',
    manufacturer: '',
    veterinarian: '',
    dosage: '',
    administration_route: '',
    injection_site: '',
    adverse_reactions: '',
    notes: '',
  });

  const { data: pigeons } = usePigeons();
  const { data: vaccineTypes } = useVaccineTypes();
  const createVaccination = useCreateVaccination();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pigeon_id || !formData.vaccine_type_id) {
      return;
    }

    try {
      await createVaccination.mutateAsync({
        pigeon_id: formData.pigeon_id,
        vaccine_type_id: formData.vaccine_type_id,
        vaccination_date: formData.vaccination_date,
        next_due_date: formData.next_due_date || undefined,
        batch_number: formData.batch_number || undefined,
        manufacturer: formData.manufacturer || undefined,
        veterinarian: formData.veterinarian || undefined,
        dosage: formData.dosage || undefined,
        administration_route: formData.administration_route || undefined,
        injection_site: formData.injection_site || undefined,
        adverse_reactions: formData.adverse_reactions || undefined,
        notes: formData.notes || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create vaccination:', error);
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
                  {pigeon.band_number} - {pigeon.name || '未命名'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>疫苗类型</Label>
          <Select value={formData.vaccine_type_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, vaccine_type_id: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue placeholder="选择疫苗类型" />
            </SelectTrigger>
            <SelectContent>
              {vaccineTypes?.map((vaccine) => (
                <SelectItem key={vaccine.id} value={vaccine.id.toString()}>
                  {vaccine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>接种日期</Label>
          <Input
            type="date"
            value={formData.vaccination_date}
            onChange={(e) => setFormData(prev => ({ ...prev, vaccination_date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>下次接种日期</Label>
          <Input
            type="date"
            value={formData.next_due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>批次号</Label>
          <Input
            value={formData.batch_number}
            onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
            placeholder="输入疫苗批次号"
          />
        </div>

        <div className="space-y-2">
          <Label>制造商</Label>
          <Input
            value={formData.manufacturer}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
            placeholder="输入疫苗制造商"
          />
        </div>
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
          <Label>剂量</Label>
          <Input
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
            placeholder="输入疫苗剂量"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>接种途径</Label>
          <Select value={formData.administration_route} onValueChange={(value) => setFormData(prev => ({ ...prev, administration_route: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="选择接种途径" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="injection">注射</SelectItem>
              <SelectItem value="oral">口服</SelectItem>
              <SelectItem value="nasal">鼻腔</SelectItem>
              <SelectItem value="eye">眼部</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>注射部位</Label>
          <Input
            value={formData.injection_site}
            onChange={(e) => setFormData(prev => ({ ...prev, injection_site: e.target.value }))}
            placeholder="输入注射部位"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>不良反应</Label>
        <Textarea
          value={formData.adverse_reactions}
          onChange={(e) => setFormData(prev => ({ ...prev, adverse_reactions: e.target.value }))}
          placeholder="描述任何不良反应..."
          rows={3}
        />
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
        <Button type="submit" disabled={createVaccination.isPending}>
          {createVaccination.isPending ? '保存中...' : '保存接种记录'}
        </Button>
      </div>
    </form>
  );
}

export default VaccinationManager;