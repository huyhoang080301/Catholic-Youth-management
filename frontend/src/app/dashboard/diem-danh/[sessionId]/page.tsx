'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { useSession, useSessionMembers, useSubmitAttendance } from '@/hooks/use-attendance'
import { AttendanceStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SessionAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const { data: session, isLoading: sessionLoading } = useSession(sessionId)
  const { data: members, isLoading: membersLoading } = useSessionMembers(sessionId)
  const submitAttendance = useSubmitAttendance()

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  const handleAttendanceChange = useCallback(
    (memberId: string, status: AttendanceStatus) => {
      setAttendance((prev) => ({ ...prev, [memberId]: status }))
    },
    []
  )

  const handleSubmit = async () => {
    if (!members) return
    const records = members.map((member) => ({
      memberId: member.id,
      status: attendance[member.id] || AttendanceStatus.ABSENT,
    }))
    try {
      await submitAttendance.mutateAsync({ sessionId, records })
      toast.success('Đã lưu điểm danh thành công!')
      router.push('/dashboard/diem-danh')
    } catch (error) {
      toast.error('Lưu điểm danh thất bại. Vui lòng thử lại.')
    }
  }

  const isLoading = sessionLoading || membersLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Buổi sinh hoạt không tìm thấy</p>
        </CardContent>
      </Card>
    )
  }

  const presentCount = Object.values(attendance).filter((s) => s === AttendanceStatus.PRESENT).length
  const absentCount = Object.values(attendance).filter((s) => s === AttendanceStatus.ABSENT).length
  const excusedCount = Object.values(attendance).filter((s) => s === AttendanceStatus.EXCUSED).length
  const unitName = session.organizationUnit?.name

  return (
    <div className="space-y-6">
      <Link href="/dashboard/diem-danh">
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          {unitName && <p className="text-gray-500 text-sm">{unitName}</p>}
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-600">
            <span className="font-medium">Ngày:</span> {formatDate(session.date)}
          </p>
          {session.description && (
            <p className="text-gray-600">
              <span className="font-medium">Mô tả:</span> {session.description}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            <p className="text-sm text-gray-600 mt-1">Có mặt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            <p className="text-sm text-gray-600 mt-1">Vắng mặt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">{excusedCount}</p>
            <p className="text-sm text-gray-600 mt-1">Nghỉ phép</p>
          </CardContent>
        </Card>
      </div>

      {members && members.length > 0 ? (
        <>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Danh sách điểm danh ({members.length} thành viên)
            </h2>
            <AttendanceList
              members={members}
              onAttendanceChange={handleAttendanceChange}
              currentStatus={attendance}
            />
          </div>
          <div className="flex gap-3 sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 -mx-4 -mb-6 px-6 py-4 md:static md:border-none md:bg-transparent md:p-0">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>
              Hủy
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              isLoading={submitAttendance.isPending}
              disabled={submitAttendance.isPending}
            >
              Lưu điểm danh
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Không có thành viên nào trong buổi sinh hoạt này.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
