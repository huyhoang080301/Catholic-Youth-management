'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Member, Attendance, AttendanceStatus, MemberStatusHistory, MemberTeam } from '@/types'
import { ArrowLeft, Download, UserPlus, ArrowRightLeft, History, Shield, Users, Pencil, Trash2 } from 'lucide-react'
import { MemberTransitionModal } from '@/components/members/member-transition-modal'
import { EditMemberModal } from '@/components/common/edit-member-modal'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Nghỉ học',
  on_leave: 'Tạm nghỉ',
  reserved: 'Bảo lưu',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  inactive: 'error',
  on_leave: 'warning',
  reserved: 'default',
}

const LEVEL_LABELS: Record<string, string> = {
  cap_1: 'Cấp 1',
  cap_2: 'Cấp 2',
  cap_3: 'Cấp 3',
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || 'Chưa cập nhật'}</p>
    </div>
  )
}

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string
  const queryClient = useQueryClient()

  const [showTransitionModal, setShowTransitionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [accountResult, setAccountResult] = useState<{ memberCode: string; password: string } | null>(null)
  const [accountError, setAccountError] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'teams' | 'attendance'>('info')

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data } = await api.get<Member>(`/members/${memberId}`)
      return data
    },
    enabled: !!memberId,
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      const { data } = await api.get<Attendance[] | { data: Attendance[] }>(`/attendance/members/${memberId}`)
      return Array.isArray(data) ? data : (data as { data: Attendance[] }).data ?? []
    },
    enabled: !!memberId,
  })

  const { data: history } = useQuery({
    queryKey: ['member-history', memberId],
    queryFn: async () => {
      const { data } = await api.get<MemberStatusHistory[]>(`/members/${memberId}/history`)
      return data
    },
    enabled: !!memberId && showHistory,
  })

  const { data: memberTeams } = useQuery({
    queryKey: ['member-teams', memberId],
    queryFn: async () => {
      const { data } = await api.get<MemberTeam[]>(`/members/${memberId}/teams`)
      return Array.isArray(data) ? data : (data as { data: MemberTeam[] }).data ?? []
    },
    enabled: !!memberId,
  })

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ memberCode: string; password: string }>(`/members/${memberId}/create-account`)
      return data
    },
    onSuccess: (result) => {
      setAccountResult(result)
      setAccountError('')
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      setAccountError(msg)
    },
  })

  const deleteMember = useMutation({
    mutationFn: async () => {
      await api.delete(`/members/${memberId}`)
    },
    onSuccess: () => {
      toast.success('Đã xóa thành viên')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      window.location.href = '/dashboard/thanh-vien'
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra'
      toast.error(msg)
    },
  })

  const handleExportMember = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/members/export/members?unitId=${member?.organizationUnitId ?? ''}`
    window.open(url, '_blank')
  }

  const handleExportAttendance = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/members/export/attendance-stats?unitId=${member?.organizationUnitId ?? ''}`
    window.open(url, '_blank')
  }

  const isLoading = memberLoading || attendanceLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Không tìm thấy thành viên</p>
        </CardContent>
      </Card>
    )
  }

  const genderLabel = member.gender === 'male' ? 'Nam' : member.gender === 'female' ? 'Nữ' : 'Chưa cập nhật'

  const addressText = member.address
    ? [member.address.street, member.address.ward, member.address.district, member.address.province].filter(Boolean).join(', ')
    : null

  const parentAddressText = member.parent?.address
    ? [member.parent.address.street, member.parent.address.ward, member.parent.address.district, member.parent.address.province].filter(Boolean).join(', ')
    : null

  const hasSacraments = member.baptismDate || member.firstConfessionDate || member.firstCommunionDate || member.confirmationDate
  const memberStatus = member.status ?? 'active'

  return (
    <div className="space-y-6">
      <Link href="/dashboard/thanh-vien">
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </Link>

      {/* Thông tin cơ bản */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
              {member.baptismName && (
                <p className="text-sm text-gray-600 mt-1">Tên thánh: <span className="font-semibold">{member.baptismName}</span></p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={STATUS_VARIANTS[memberStatus]}>
                  {STATUS_LABELS[memberStatus]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 text-sm"
              >
                <Pencil className="h-4 w-4" />
                Sửa thông tin
              </Button>
              <Button
                onClick={() => setShowTransitionModal(true)}
                className="flex items-center gap-2 text-sm"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Chuyển đổi trạng thái
              </Button>
              {member.isActive && (
                <Button
                  onClick={() => createAccountMutation.mutate()}
                  className="flex items-center gap-2 text-sm"
                  disabled={createAccountMutation.isPending}
                >
                  {createAccountMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Tạo tài khoản
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleExportMember}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Xuất danh sách
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAttendance}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Xuất thống kê
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm"
              >
                <History className="h-4 w-4" />
                Lịch sử chuyển đổi
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Xác nhận xóa thành viên "${member.fullName}"? Hành động này không thể hoàn tác.`)) {
                    deleteMember.mutate()
                  }
                }}
                className="flex items-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50"
                disabled={deleteMember.isPending}
              >
                {deleteMember.isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Xóa thành viên
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Account creation result */}
          {accountResult && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-green-800 mb-1">Tài khoản đã được tạo thành công</p>
              <p className="text-green-700">Mã số: <span className="font-mono font-semibold">{accountResult.memberCode}</span></p>
              <p className="text-green-700">Mật khẩu tạm: <span className="font-mono font-semibold">{accountResult.password}</span></p>
              <p className="text-xs text-green-600 mt-1">Vui lòng thông báo mật khẩu cho thành viên và yêu cầu đổi sau lần đăng nhập đầu tiên.</p>
            </div>
          )}
          {accountError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {accountError}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Giới tính" value={genderLabel} />
            <InfoRow label="Ngày sinh" value={member.dateOfBirth ? formatDate(member.dateOfBirth) : null} />
            <InfoRow label="Số điện thoại" value={member.phone} />
            <InfoRow label="Đơn vị" value={member.organizationUnit?.name} />
            <InfoRow label="Cấp" value={member.level ? (LEVEL_LABELS[member.level] ?? member.level) : null} />
            {addressText && <InfoRow label="Địa chỉ" value={addressText} />}
            {member.notes && <InfoRow label="Ghi chú" value={member.notes} />}
          </div>
        </CardContent>
      </Card>

      {/* Tab selector */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['info', 'teams', 'attendance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'info' ? 'Thông tin' : tab === 'teams' ? 'Đội' : 'Điểm danh'}
          </button>
        ))}
      </div>

      {/* Info Tab Content */}
      {activeTab === 'info' && (
        <>
          {/* Lịch sử chuyển đổi */}
          {showHistory && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Lịch sử chuyển đổi</h2>
              {history && history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((h) => (
                    <Card key={h.id}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{h.transitionType.replace(/_/g, ' ')}</p>
                            {h.reason && <p className="text-xs text-gray-500 mt-0.5">Lý do: {h.reason}</p>}
                            {h.performedBy && <p className="text-xs text-gray-400">Thực hiện bởi: {h.performedBy}</p>}
                          </div>
                          <p className="text-xs text-gray-400">{formatDate(h.createdAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-center text-gray-600 text-sm">Chưa có lịch sử chuyển đổi</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Thông tin phụ huynh */}
          {member.parent && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin phụ huynh</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Họ tên" value={member.parent.fullName} />
                  <InfoRow label="Số điện thoại" value={member.parent.phone} />
                  {parentAddressText && <InfoRow label="Địa chỉ" value={parentAddressText} />}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Các mốc bí tích */}
          {hasSacraments && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Các mốc bí tích</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {member.baptismDate && (
                    <>
                      <InfoRow label="Ngày Rửa Tội" value={formatDate(member.baptismDate)} />
                      <InfoRow label="Nơi Rửa Tội" value={member.baptismPlace} />
                    </>
                  )}
                  {member.firstConfessionDate && (
                    <>
                      <InfoRow label="Ngày Xưng Tội lần đầu" value={formatDate(member.firstConfessionDate)} />
                      <InfoRow label="Nơi Xưng Tội" value={member.firstConfessionPlace} />
                    </>
                  )}
                  {member.firstCommunionDate && (
                    <>
                      <InfoRow label="Ngày Rước Lễ lần đầu" value={formatDate(member.firstCommunionDate)} />
                      <InfoRow label="Nơi Rước Lễ" value={member.firstCommunionPlace} />
                    </>
                  )}
                  {member.confirmationDate && (
                    <>
                      <InfoRow label="Ngày Thêm Sức" value={formatDate(member.confirmationDate)} />
                      <InfoRow label="Nơi Thêm Sức" value={member.confirmationPlace} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Teams Tab Content */}
      {activeTab === 'teams' && (
        <div className="space-y-3">
          {memberTeams && memberTeams.length > 0 ? (
            memberTeams.map((mt) => (
              <Card key={mt.id}>
                <CardContent className="py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{mt.team.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {mt.team.branch && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {mt.team.branch.replace('_', ' ')}
                          </span>
                        )}
                        {mt.team.teamType && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${mt.team.teamType === 'cross_branch' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {mt.team.teamType === 'cross_branch' ? 'Liên ngành' : 'Trong ngành'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {mt.team.leader && <p>Trưởng: {mt.team.leader.fullName}</p>}
                      {mt.team.deputy && <p>Phó: {mt.team.deputy.fullName}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-600">
                  <Shield className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p>Chưa tham gia đội nào.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attendance Tab Content */}
      {activeTab === 'attendance' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lịch sử điểm danh</h2>
          {attendance && attendance.length > 0 ? (
            (() => {
              // Group by month-year
              const grouped = attendance.reduce<Record<string, Attendance[]>>((acc, record) => {
                const date = new Date(record.createdAt)
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                const label = `Tháng ${date.getMonth() + 1} / ${date.getFullYear()}`
                if (!acc[key]) acc[key] = []
                acc[key].push(record)
                return acc
              }, {})
              return (
                <div className="space-y-6">
                  {Object.entries(grouped)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([key, records]) => {
                      const monthLabel = (() => {
                        const [year, month] = key.split('-')
                        return `Tháng ${parseInt(month)} / ${year}`
                      })()
                      return (
                        <div key={key}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {monthLabel}
                          </h3>
                          <div className="space-y-2">
                            {records
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((record) => (
                                <Card key={record.id} className="border-l-4 border-l-blue-200">
                                  <CardContent className="py-3 px-5">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {record.session?.title ?? `Buổi #${record.sessionId}`}
                                        </p>
                                        <p className="text-sm text-gray-600">{formatDate(record.createdAt)}</p>
                                      </div>
                                      <Badge
                                        variant={
                                          record.status === AttendanceStatus.PRESENT
                                            ? 'success'
                                            : record.status === AttendanceStatus.ABSENT
                                            ? 'error'
                                            : 'warning'
                                        }
                                      >
                                        {record.status === AttendanceStatus.PRESENT
                                          ? 'Có mặt'
                                          : record.status === AttendanceStatus.ABSENT
                                          ? 'Vắng mặt'
                                          : 'Nghỉ phép'}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )
            })()
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">Chưa có lịch sử điểm danh.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transition Modal */}
      {showTransitionModal && (
        <MemberTransitionModal
          memberId={member.id}
          memberName={member.fullName}
          onClose={() => setShowTransitionModal(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditMemberModal
          memberId={member.id}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
