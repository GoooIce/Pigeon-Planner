import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Calendar, MapPin, Clock, Wind, Thermometer, Trophy } from 'lucide-react'

// 表单验证模式
const raceFormSchema = z.object({
  race_name: z.string().min(1, '比赛名称不能为空'),
  race_date: z.string().min(1, '比赛日期不能为空'),
  distance_km: z.number().min(1, '比赛距离必须大于0'),
  release_point: z.string().optional(),
  release_time: z.string().optional(),
  weather_condition: z.string().optional(),
  wind_speed: z.number().optional(),
  wind_direction: z.string().optional(),
  temperature: z.number().optional(),
  category: z.string().min(1, '比赛类别不能为空'),
  status: z.string().min(1, '比赛状态不能为空'),
  notes: z.string().optional(),
})

type RaceFormData = z.infer<typeof raceFormSchema>

interface Race {
  id?: number
  race_name: string
  race_date: string
  distance_km: number
  release_point?: string
  release_time?: string
  weather_condition?: string
  wind_speed?: number
  wind_direction?: string
  temperature?: number
  category: string
  status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

interface RaceFormProps {
  race?: Race | null
  onSubmit: (data: Partial<Race>) => void
  onCancel: () => void
  isLoading: boolean
}

export const RaceForm: React.FC<RaceFormProps> = ({
  race,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const isEditing = !!race?.id

  const form = useForm<RaceFormData>({
    resolver: zodResolver(raceFormSchema),
    defaultValues: {
      race_name: '',
      race_date: '',
      distance_km: 100,
      release_point: '',
      release_time: '',
      weather_condition: '',
      wind_speed: undefined,
      wind_direction: '',
      temperature: undefined,
      category: '',
      status: 'scheduled',
      notes: '',
    },
  })

  // 当编辑比赛时，填充表单数据
  useEffect(() => {
    if (race) {
      form.reset({
        race_name: race.race_name || '',
        race_date: race.race_date || '',
        distance_km: race.distance_km || 100,
        release_point: race.release_point || '',
        release_time: race.release_time || '',
        weather_condition: race.weather_condition || '',
        wind_speed: race.wind_speed || undefined,
        wind_direction: race.wind_direction || '',
        temperature: race.temperature || undefined,
        category: race.category || '',
        status: race.status || 'scheduled',
        notes: race.notes || '',
      })
    }
  }, [race, form])

  const handleSubmit = (data: RaceFormData) => {
    onSubmit(data)
  }

  const windDirections = [
    { value: 'N', label: '北风' },
    { value: 'NE', label: '东北风' },
    { value: 'E', label: '东风' },
    { value: 'SE', label: '东南风' },
    { value: 'S', label: '南风' },
    { value: 'SW', label: '西南风' },
    { value: 'W', label: '西风' },
    { value: 'NW', label: '西北风' },
  ]

  const weatherConditions = [
    { value: 'sunny', label: '晴天' },
    { value: 'cloudy', label: '多云' },
    { value: 'overcast', label: '阴天' },
    { value: 'light_rain', label: '小雨' },
    { value: 'rain', label: '雨' },
    { value: 'heavy_rain', label: '大雨' },
    { value: 'windy', label: '大风' },
    { value: 'fog', label: '雾' },
  ]

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {isEditing ? '编辑比赛' : '创建新比赛'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="race_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>比赛名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入比赛名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="race_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>比赛日期 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>比赛类别 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择比赛类别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short">短距离</SelectItem>
                          <SelectItem value="middle">中距离</SelectItem>
                          <SelectItem value="long">长距离</SelectItem>
                          <SelectItem value="young_bird">幼鸽赛</SelectItem>
                          <SelectItem value="old_bird">老鸽赛</SelectItem>
                          <SelectItem value="special">特殊比赛</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>比赛状态 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择比赛状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">计划中</SelectItem>
                          <SelectItem value="registration">报名中</SelectItem>
                          <SelectItem value="in_progress">进行中</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="cancelled">已取消</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="distance_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>比赛距离 (公里) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="release_point"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>放飞地点</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入放飞地点" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="release_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>放飞时间</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 天气信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">天气信息（可选）</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weather_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>天气状况</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择天气状况" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weatherConditions.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>温度 (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="20"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wind_speed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>风速 (km/h)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wind_direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>风向</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择风向" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {windDirections.map((direction) => (
                            <SelectItem key={direction.value} value={direction.value}>
                              {direction.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">备注</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注信息</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入备注信息..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '保存中...' : isEditing ? '更新比赛' : '创建比赛'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}