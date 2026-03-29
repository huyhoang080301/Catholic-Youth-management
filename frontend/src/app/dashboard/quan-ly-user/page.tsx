'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CreateUserModal } from '@/components/common/create-user-modal'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { User, UserUnitRole } from '@/types'
import { UserPlus, Trash2, Download, Pencil, Shield, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function QuanLyUserPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[] | { data: User[] }>('/users')
      return Array.isArray(data) ? data : (data as { data: User[] }).data ?? []
    },
  })

  const filteredUsers = users?.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    )
  })

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete('/users/' + id)
    },
    onSuccess: () => {
      toast.success('Đã xóa tài khoản')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await api.patch(`/users/${id}/active`, { isActive })
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const handleExportUsers = () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? ''
    window.open(`${base}/users/export`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-600 mt-1">Danh sách người dùng hệ thống TNTT</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={handleExportUsers}>
            <Download className="h-4 w-4" />
            Xuất danh sách
          </Button>
          <ExcelImportButton
            uploadUrl="/users/import"
            label="Import Excel"
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          />
          <Button
            variant="primary"
            onClick={() => { setEditingUser(null); setShowCreateModal(true) }}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Tạo tài khoản
          </Button>
        </div>
      </div>

      {/* Note */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="font-medium mb-1">Định dạng Excel (các cột cần có):</p>
        <p>email | password | fullName | phone (tùy chọn)</p>
        <p className="mt-1 text-gray-400">Nếu không có cột password, mặc định là Abc@123456</p>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Input
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{user.fullName}</p>
                      {user.roles && user.roles.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="default" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {role === 'admin' ? 'Quản trị' : role === 'chu_nhiem' ? 'Chủ nhiệm' : role === 'truong_ban' ? 'Trưởng ban' : role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                    <button
                      onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
                      disabled={toggleActive.isPending}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                    >
                      {user.isActive ? 'Khóa' : 'Mở'}
                    </button>
                    <button
                      onClick={() => { setEditingUser(user); setShowCreateModal(true) }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowRoleModal(user)}
                      className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Phân quyền"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xác nhận xóa tài khoản "${user.fullName}"?`)) {
                          deleteUser.mutate(user.id)
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              {users?.length === 0 ? 'Chưa có tài khoản nào.' : 'Không tìm thấy kết quả.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => { setShowCreateModal(false); setEditingUser(null) }}
          editingUser={editingUser ?? undefined}
        />
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <RoleModal
          user={showRoleModal}
          onClose={() => setShowRoleModal(null)}
        />
      )}
    </div>
  )
}

// ─── Role Assignment Modal ──────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Quản trị viên (Admin)' },
  { value: 'chu_nhiem', label: 'Chủ nhiệm' },
  { value: 'truong_ban', label: 'Trưởng ban' },
  { value: 'pho_lop', label: 'Phó lớp' },
  { value: 'huynh_truong', label: 'Hướng dẫn viên' },
]

function RoleModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')

  const { data: roles, isLoading } = useQuery<UserUnitRole[]>({
    queryKey: ['user-roles', user.id],
    queryFn: async () => {
      const { data } = await api.get<UserUnitRole[]>(`/users/${user.id}/roles`)
      return data
    },
  })

  const assignRole = useMutation({
    mutationFn: async () => {
      await api.post(`/users/${user.id}/roles`, { role: selectedRole })
    },
    onSuccess: () => {
      toast.success('Đã gán vai trò')
      queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] })
      setSelectedRole('')
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const removeRole = useMutation({
    mutationFn: async (roleId: number) => {
      await api.delete(`/users/${user.id}/roles/${roleId}`)
    },
    onSuccess: () => {
      toast.success('Đã xóa vai trò')
      queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Phân quyền</h2>
            <p className="text-sm text-gray-600 mt-0.5">{user.fullName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current roles */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Vai trò hiện tại</p>
            {isLoading ? (
              <Spinner size="sm" />
            ) : roles && roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map((r) => {
                  const label = ROLE_OPTIONS.find((o) => o.value === r.role)?.label ?? r.role
                  return (
                    <div key={r.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-sm text-blue-800 font-medium">{label}</span>
                      <button
                        onClick={() => removeRole.mutate(r.id)}
                        disabled={removeRole.isPending}
                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Chưa có vai trò nào</p>
            )}
          </div>

          {/* Add role */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Thêm vai trò</p>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Chọn vai trò --</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <Button
                onClick={() => assignRole.mutate()}
                disabled={!selectedRole || assignRole.isPending}
                isLoading={assignRole.isPending}
                size="sm"
              >
                Thêm
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
