'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
import { Card, CardContent } from '@/components/ui/card'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type ScheduleRuleType = 'weekly' | 'biweekly' | 'semi_monthly'

const WEEK_DAYS = [
  { value: 0, label: 'CN' },
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
]

const WEEK_NUMBERS = [
  { value: 1, label: 'Tuần 1' },
  { value: 2, label: 'Tuần 2' },
  { value: 3, label: 'Tuần 3' },
  { value: 4, label: 'Tuần 4' },
  { value: 5, label: 'Tuần 5' },
]

interface SessionScheduleModalProps {
  unitId: number
  onClose: () => void
}

export function SessionScheduleModal({ unitId, onClose }: SessionScheduleModalProps) {
  const [title, setTitle] = useState('')
  const [ruleType, setRuleType] = useState<ScheduleRuleType>('weekly')
  const [weekDays, setWeekDays] = useState<number[]>([0])
  const [weekNumbers, setWeekNumbers] = useState<number[]>([2, 4])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [time, setTime] = useState('08:00')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<number | null>(null)

  const toggleDay = (day: number) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const toggleWeekNumber = (num: number) => {
    setWeekNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    )
  }

  const handleSubmit = async () => {
    if (!title || !startDate || weekDays.length === 0) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.')
      return
    }
    if (ruleType === 'semi_monthly' && weekNumbers.length === 0) {
      setError('Vui lòng chọn ít nhất một tuần trong tháng.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const createRes = await fetch(`${API_URL}/api/session-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationUnitId: unitId,
          title,
          ruleType,
          weekDays,
          weekNumbers: ruleType === 'semi_monthly' ? weekNumbers : [],
          startDate,
          endDate: endDate || undefined,
          time,
          note: note || undefined,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.message || 'Tạo lịch thất bại')
      }

      const schedule = await createRes.json()

      const generateRes = await fetch(`${API_URL}/api/session-schedules/${schedule.id}/generate`, {
        method: 'POST',
      })

      if (!generateRes.ok) {
        throw new Error('Tạo các buổi sinh hoạt thất bại')
      }

      const result = await generateRes.json()
      setSuccess(result.generated)
      toast.success(`Đã tạo ${result.generated} buổi sinh hoạt!`)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Tạo lịch cả năm</h2>
            <p className="text-xs text-gray-500 mt-0.5">Tự động tạo các buổi sinh hoạt</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="space-y-4 pt-4">
          {success !== null ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-medium text-gray-900">
                Đã tạo thành công {success} buổi sinh hoạt!
              </p>
              <p className="text-sm text-gray-500">
                Các buổi sinh hoạt đã được thêm vào lớp.
              </p>
              <Button onClick={onClose} className="mt-2">
                Đóng
              </Button>
            </div>
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên buổi sinh hoạt <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Buổi sinh hoạt"
                />
              </div>

              {/* Rule type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quy tắc lặp lại <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'weekly', label: 'Hàng tuần' },
                    { value: 'biweekly', label: 'Cách tuần' },
                    { value: 'semi_monthly', label: 'Nửa tháng' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRuleType(opt.value as ScheduleRuleType)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        ruleType === opt.value
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày trong tuần <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-9 h-9 rounded-full text-xs font-medium border transition-colors ${
                        weekDays.includes(day.value)
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week numbers — only for semi_monthly */}
              {ruleType === 'semi_monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuần trong tháng <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {WEEK_NUMBERS.map((num) => (
                      <button
                        key={num.value}
                        type="button"
                        onClick={() => toggleWeekNumber(num.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          weekNumbers.includes(num.value)
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {num.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ ngày <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến ngày <span className="text-gray-400">(tùy chọn)</span>
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú <span className="text-gray-400">(tùy chọn)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Nghỉ lễ ..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo lịch'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
