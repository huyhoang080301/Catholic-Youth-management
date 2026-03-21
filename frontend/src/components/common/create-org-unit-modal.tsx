'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { UnitType, Branch } from '@/types'

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  xu_doan: 'Xứ đoàn',
  phan_doan: 'Phân đoàn',
  chi_doan: 'Chi đoàn',
  lop: 'Lớp',
  doi: 'Đội',
}

const BRANCH_LABELS: Record<Branch, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

interface CreateOrgUnitModalProps {
  onClose: () => void
}

export function CreateOrgUnitModal({ onClose }: CreateOrgUnitModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    type: '' as UnitType | '',
    branch: '' as Branch | '',
    description: '',
  })
  const [error, setError] = useState('')

  const createUnit = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload: {
        name: string
        type: UnitType | ''
        branch?: Branch
        description?: string
      } = { name: data.name, type: data.type }
      if (data.branch) payload.branch = data.branch as Branch
      if (data.description) payload.description = data.description
      const { data: res } = await api.post('/org-units', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-units'] })
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
    if (!form.name || !form.type) {
      setError('Tên đơn vị và loại đơn vị là bắt buộc')
      return
    }
    createUnit.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Thêm đơn vị tổ chức</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đơn vị *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Xứ đoàn Thánh Maria"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn vị *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as UnitType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn loại --</option>
              {Object.entries(UNIT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value as Branch })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn ngành (tùy chọn) --</option>
              {Object.entries(BRANCH_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả về đơn vị..."
              rows={2}
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
              isLoading={createUnit.isPending}
              disabled={createUnit.isPending}
            >
              Thêm đơn vị
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

