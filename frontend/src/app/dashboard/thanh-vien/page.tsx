'use client'

import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MemberCard } from '@/components/members/member-card'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { Member } from '@/types'
import { Search, UserPlus } from 'lucide-react'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { CreateMemberModal } from '@/components/common/create-member-modal'

export default function ThanhVienPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data } = await api.get<Member[]>('/members')
      return Array.isArray(data) ? data : (data as any)?.data ?? []
    },
  })

  const filteredMembers = members?.filter((member) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thành viên</h1>
          <p className="text-gray-600 mt-1">Quản lý danh sách đoàn viên</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImportButton
            uploadUrl="/members/import"
            label="Import Excel"
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
          />
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="h-5 w-5" />
            Thêm thành viên
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="font-medium mb-1">Định dạng Excel (các cột cần có):</p>
        <p>fullName | dateOfBirth (YYYY-MM-DD) | phone | orgUnitId (tùy chọn)</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredMembers && filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <p className="text-center text-gray-600">
              {members?.length === 0
                ? 'Chưa có thành viên nào'
                : 'Không tìm thấy thành viên phù hợp'}
            </p>
            {members?.length === 0 && (
              <div className="flex justify-center mt-4">
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Thêm thành viên đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateMemberModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
