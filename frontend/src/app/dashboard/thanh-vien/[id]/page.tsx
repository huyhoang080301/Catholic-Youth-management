'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Member, Attendance, AttendanceStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
              {member.baptismName && (
                <p className="text-gray-500 mt-1">Tên thánh: <span className="font-medium text-gray-700">{member.baptismName}</span></p>
              )}
            </div>
            <Badge variant={member.isActive ? 'success' : 'default'}>
              {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Badge>
          </div>
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
    </div>
  )
}





