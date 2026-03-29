'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { User } from '@/types'

interface CreateUserForm {
  email: string
  password: string
  fullName: string
  phone: string
}

interface CreateUserModalProps {
  onClose: () => void
  editingUser?: User
}

export function CreateUserModal({ onClose, editingUser }: CreateUserModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!editingUser
  const [form, setForm] = useState<CreateUserForm>({
    email: editingUser?.email ?? '',
    password: '',
    fullName: editingUser?.fullName ?? '',
    phone: editingUser?.phone ?? '',
  })
  const [error, setError] = useState('')

  const saveUser = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      if (isEditing) {
        const payload: Record<string, unknown> = { fullName: data.fullName }
        if (data.phone) payload.phone = data.phone
        if (data.password) payload.password = data.password
        const { data: res } = await api.patch(`/users/${editingUser!.id}`, payload)
        return res
      } else {
        const payload: { email: string; password: string; fullName: string; phone?: string } = {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
        }
        if (data.phone) payload.phone = data.phone
        const { data: res } = await api.post('/users', payload)
        return res
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
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
    if (!form.fullName) {
      setError('Họ tên là bắt buộc')
      return
    }
    if (!isEditing) {
      if (!form.email) { setError('Email là bắt buộc'); return }
      if (!form.password) { setError('Mật khẩu là bắt buộc'); return }
    }
    saveUser.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md md:mt-8 mt-4 mb-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEditing ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={isEditing ? 'Bỏ trống nếu không đổi' : 'Tối thiểu 6 ký tự'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0901234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              isLoading={saveUser.isPending}
              disabled={saveUser.isPending}
            >
              {isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

