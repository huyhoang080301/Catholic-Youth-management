'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { OrganizationUnit } from '@/types'

interface CreateSessionForm {
  title: string
  date: string
  description: string
  organizationUnitId: string
}

interface CreateSessionModalProps {
  onClose: () => void
}

export function CreateSessionModal({ onClose }: CreateSessionModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateSessionForm>({
    title: '',
    date: '',
    description: '',
    organizationUnitId: '',
  })
  const [error, setError] = useState('')

  const { data: units } = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/org-units')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  const createSession = useMutation({
    mutationFn: async (data: CreateSessionForm) => {
      const payload: {
        title: string
        date: string
        description?: string
        organizationUnitId?: number
      } = { title: data.title, date: data.date }
      if (data.description) payload.description = data.description
      if (data.organizationUnitId) payload.organizationUnitId = Number(data.organizationUnitId)
      const { data: res } = await api.post('/sessions', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.date) {
      setError('Tên buổi và ngày là bắt buộc')
      return
    }
    createSession.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Tạo buổi sinh hoạt mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi sinh hoạt *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sinh hoạt Chúa Nhật tuần 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
            <select
              value={form.organizationUnitId}
              onChange={(e) => setForm({ ...form, organizationUnitId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn đơn vị (tùy chọn) --</option>
              {units?.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả buổi sinh hoạt..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={createSession.isPending}
              disabled={createSession.isPending}
            >
              Tạo buổi sinh hoạt
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

