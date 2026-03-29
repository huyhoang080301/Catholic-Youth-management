'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Member, Gender, MemberLevel } from '@/types'

interface EditMemberForm {
  fullName: string
  baptismName: string
  dateOfBirth: string
  gender: Gender | ''
  phone: string
  level: MemberLevel | ''
  notes: string
}

interface EditMemberModalProps {
  memberId: number
  onClose: () => void
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

export function EditMemberModal({ memberId, onClose }: EditMemberModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EditMemberForm>({
    fullName: '',
    baptismName: '',
    dateOfBirth: '',
    gender: '' as Gender | '',
    phone: '',
    level: '' as MemberLevel | '',
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data } = await api.get<Member>(`/members/${memberId}`)
      return data
    },
    enabled: !!memberId,
  })

  useEffect(() => {
    if (member) {
      setForm({
        fullName: member.fullName ?? '',
        baptismName: member.baptismName ?? '',
        dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).substring(0, 10) : '',
        gender: member.gender ?? '' as Gender | '',
        phone: member.phone ?? '',
        level: member.level ?? '' as MemberLevel | '',
        notes: member.notes ?? '',
      })
    }
  }, [member])

  const updateMember = useMutation({
    mutationFn: async (data: EditMemberForm) => {
      const payload: Record<string, unknown> = {}
      if (data.fullName.trim()) payload.fullName = data.fullName.trim()
      if (data.baptismName.trim()) payload.baptismName = data.baptismName.trim()
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth
      if (data.gender) payload.gender = data.gender
      if (data.phone.trim()) payload.phone = data.phone.trim()
      if (data.level) payload.level = data.level
      if (data.notes.trim()) payload.notes = data.notes.trim()
      const { data: res } = await api.patch<Member>(`/members/${memberId}`, payload)
      return res
    },
    onSuccess: () => {
      toast.success('Cập nhật thành viên thành công!')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra'
      toast.error(msg)
      setError(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) {
      setError('Họ tên là bắt buộc')
      return
    }
    updateMember.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Sửa thông tin thành viên</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className={inputCls}
            />
          </div>

          {/* Tên thánh */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên thánh</label>
            <input
              type="text"
              value={form.baptismName}
              onChange={(e) => setForm({ ...form, baptismName: e.target.value })}
              placeholder="Maria, Giuse, ..."
              className={inputCls}
            />
          </div>

          {/* Ngày sinh + Giới tính */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender | '' })}
                className={inputCls}
              >
                <option value="">-- Chọn --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0901234567"
              className={inputCls}
            />
          </div>

          {/* Cấp */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cấp</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as MemberLevel | '' })}
              className={inputCls}
            >
              <option value="">-- Chọn cấp --</option>
              <option value="cap_1">Cấp 1</option>
              <option value="cap_2">Cấp 2</option>
              <option value="cap_3">Cấp 3</option>
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ghi chú thêm..."
              rows={2}
              className={`${inputCls} resize-none`}
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
              isLoading={updateMember.isPending}
              disabled={updateMember.isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
