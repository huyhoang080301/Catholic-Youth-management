'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Member, Attendance, AttendanceStatus, MemberStatusHistory } from '@/types'
import { ArrowLeft, Download, UserPlus, ArrowRightLeft, History } from 'lucide-react'
import { MemberTransitionModal } from '@/components/members/member-transition-modal'

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
  const [showHistory, setShowHistory] = useState(false)
  const [accountResult, setAccountResult] = useState<{ email: string; password: string } | null>(null)
  const [accountError, setAccountError] = useState('')

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

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ email: string; password: string }>(`/members/${memberId}/create-account`)
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
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
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
                <p className="text-gray-500 mt-1">Tên thánh: <span className="font-medium text-gray-700">{member.baptismName}</span></p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={member.isActive ? 'success' : 'default'}>
                  {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
                <Badge variant={STATUS_VARIANTS[memberStatus] ?? 'default'}>
                  {STATUS_LABELS[memberStatus] ?? memberStatus}
                </Badge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTransitionModal(true)}
                className="flex items-center gap-2 text-sm"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Chuyển lớp / Trạng thái
              </Button>
              <Button
                variant="outline"
                onClick={() => createAccountMutation.mutate()}
                isLoading={createAccountMutation.isPending}
                className="flex items-center gap-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Tạo tài khoản
              </Button>
              <Button
                variant="outline"
                onClick={handleExportMember}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export DS
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAttendance}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export thống kê
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm"
              >
                <History className="h-4 w-4" />
                Lịch sử chuyển đổi
              </Button>
            </div>
          </div>

          {/* Account creation result */}
          {accountResult && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-green-800 mb-1">Tài khoản đã được tạo thành công</p>
              <p className="text-green-700">Email: <span className="font-mono font-semibold">{accountResult.email}</span></p>
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
            <InfoRow label="Cấp" value={member.level} />
            {addressText && <InfoRow label="Địa chỉ" value={addressText} />}
            {member.notes && <InfoRow label="Ghi chú" value={member.notes} />}
          </div>
        </CardContent>
      </Card>

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

      {/* Lịch sử điểm danh */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Lịch sử điểm danh</h2>
        {attendance && attendance.length > 0 ? (
          <div className="space-y-3">
            {attendance.map((record: Attendance) => (
              <Card key={record.id}>
                <CardContent className="py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{record.session?.title ?? `Buổi #${record.sessionId}`}</p>
                      <p className="text-sm text-gray-600">{formatDate(record.createdAt)}</p>
                    </div>
                    <Badge variant={record.status === AttendanceStatus.PRESENT ? 'success' : record.status === AttendanceStatus.ABSENT ? 'error' : 'warning'}>
                      {record.status === AttendanceStatus.PRESENT ? 'Có mặt' : record.status === AttendanceStatus.ABSENT ? 'Vắng mặt' : 'Nghỉ phép'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Chưa có lịch sử điểm danh</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transition Modal */}
      {showTransitionModal && (
        <MemberTransitionModal
          memberId={member.id}
          memberName={member.fullName}
          onClose={() => setShowTransitionModal(false)}
        />
      )}
    </div>
  )
}






