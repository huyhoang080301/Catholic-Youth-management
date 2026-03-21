'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CreateUserModal } from '@/components/common/create-user-modal'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { User } from '@/types'
import { UserPlus, Trash2 } from 'lucide-react'

export default function QuanLyUserPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[] | { data: User[] }>('/users')
      return Array.isArray(data) ? data : (data as { data: User[] }).data ?? []
    },
  })

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete('/users/' + id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-600 mt-1">Danh sách người dùng hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImportButton
            uploadUrl="/users/import"
            label="Import Excel"
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          />
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Tạo tài khoản
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="font-medium mb-1">Định dạng Excel (các cột cần có):</p>
        <p>email | password | fullName | phone (tùy chọn)</p>
        <p className="mt-1 text-gray-400">Nếu không có cột password, mặc định là Abc@123456</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                    <button
                      onClick={() => {
                        if (confirm('Xác nhận xóa tài khoản ' + user.fullName + '?')) {
                          deleteUser.mutate(user.id)
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            <p className="text-center text-gray-600">Chưa có tài khoản nào</p>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

