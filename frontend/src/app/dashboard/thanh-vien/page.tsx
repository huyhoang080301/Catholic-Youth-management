'use client'

import { useState } from 'react'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MemberCard } from '@/components/members/member-card'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { RoleGate } from '@/components/common/role-gate'
import api from '@/lib/api'
import { Member, MemberStatus, OrganizationUnit } from '@/types'
import { Search, UserPlus, Download, BarChart2 } from 'lucide-react'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { CreateMemberModal } from '@/components/common/create-member-modal'

const STATUS_FILTERS: { label: string; value: MemberStatus | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoạt động', value: 'active' },
  { label: 'Nghỉ học', value: 'inactive' },
  { label: 'Tạm nghỉ', value: 'on_leave' },
  { label: 'Bảo lưu', value: 'reserved' },
]

const PAGE_SIZE = 12

export default function ThanhVienPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const queryClient = useQueryClient()

  const { data: orgUnits } = useQuery({
    queryKey: ['org-units-all'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  const classUnits = orgUnits?.filter((u) => u.type === 'lop') ?? []
  const allTeams = orgUnits?.filter((u) => u.type === 'doi') ?? []

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data } = await api.get<Member[] | { data: Member[] }>('/members')
      return Array.isArray(data) ? data : (data as { data: Member[] }).data ?? []
    },
  })

  const filteredMembers = members?.filter((member) => {
    const matchSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberCode?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || member.status === statusFilter
    const matchClass = classFilter === 'all' || member.organizationUnitId === Number(classFilter)
    const matchTeam = teamFilter === 'all' || member.teams?.some((t) => t.teamId === Number(teamFilter))
    return matchSearch && matchStatus && matchClass && matchTeam
  })

  const totalPages = Math.ceil((filteredMembers?.length ?? 0) / PAGE_SIZE)
  const paginatedMembers = filteredMembers?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const deleteMember = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/members/${id}`)
    },
    onSuccess: () => {
      toast.success('Đã xóa thành viên')
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const handleExportMembers = () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? ''
    window.open(`${base}/members/export/members`, '_blank')
  }

  const handleExportAttendance = () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? ''
    window.open(`${base}/members/export/attendance-stats`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thành viên</h1>
          <p className="text-gray-600 mt-1">Quản lý danh sách đoàn viên</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportMembers}
          >
            <Download className="h-4 w-4" />
            Xuất danh sách
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportAttendance}
          >
            <BarChart2 className="h-4 w-4" />
            Xuất thống kê
          </Button>
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
          placeholder="Tìm kiếm theo tên, số điện thoại hoặc mã số..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          className="pl-10"
        />
      </div>

      {/* Class & Team filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="all">Tất cả lớp</option>
          {classUnits.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="all">Tất cả đội</option>
          {allTeams.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {(classFilter !== 'all' || teamFilter !== 'all') && (
          <button
            onClick={() => { setClassFilter('all'); setTeamFilter('all') }}
            className="text-xs text-blue-600 underline hover:text-blue-800"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.label}
            {f.value !== 'all' && members && (
              <span className="ml-1.5 text-xs opacity-75">
                ({members.filter((m) => f.value === 'all' || m.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredMembers && filteredMembers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedMembers?.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={(m) => { setEditingMember(m); setShowCreateModal(true) }}
                onDelete={(m) => {
                  if (confirm(`Xác nhận xóa thành viên "${m.fullName}"?`)) {
                    deleteMember.mutate(m.id)
                  }
                }}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Trước
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau →
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <p className="text-center text-gray-600">
              {members?.length === 0
                ? 'Chưa có thành viên nào.'
                : 'Không tìm thấy thành viên phù hợp.'}
            </p>
            {members?.length === 0 && (
              <div className="flex justify-center mt-4">
                <RoleGate roles={['admin', 'chu_nhiem', 'truong_ban']}>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Thêm thành viên đầu tiên
                  </Button>
                </RoleGate>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateMemberModal
          onClose={() => { setShowCreateModal(false); setEditingMember(null) }}
          editingMember={editingMember ?? undefined}
        />
      )}
    </div>
  )
}



