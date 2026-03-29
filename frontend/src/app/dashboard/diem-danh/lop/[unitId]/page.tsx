'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Plus, Calendar, Users, CalendarDays } from 'lucide-react'
import { OrganizationUnit, Member, Session, Attendance, AttendanceStatus, AttendanceRecord } from '@/types'
import { CreateSessionModal } from '@/components/common/create-session-modal'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { SessionScheduleModal } from '@/components/attendance/session-schedule-modal'

function useClassDetail(unitId: string) {
  return useQuery({
    queryKey: ['class-detail', unitId],
    queryFn: async () => {
      const [unitRes, membersRes, sessionsRes] = await Promise.all([
        api.get<OrganizationUnit>(`/organization/${unitId}`),
        api.get<Member[]>(`/organization/${unitId}/members`),
        api.get<Session[]>(`/sessions?unitId=${unitId}`),
      ])
      return {
        unit: unitRes.data,
        members: Array.isArray(membersRes.data) ? membersRes.data : [],
        sessions: Array.isArray(sessionsRes.data) ? sessionsRes.data : [],
      }
    },
    enabled: !!unitId,
  })
}

function useSessionAttendance(sessionId: number | null) {
  return useQuery({
    queryKey: ['attendance', sessionId],
    queryFn: async () => {
      const { data } = await api.get<Attendance[]>(`/attendance/sessions/${sessionId}`)
      return Array.isArray(data) ? data : []
    },
    enabled: !!sessionId,
  })
}

function useSubmitAttendance() {
  return useMutation({
    mutationFn: async ({ sessionId, records }: { sessionId: number; records: AttendanceRecord[] }) => {
      const { data } = await api.post<Attendance[]>(`/attendance/sessions/${sessionId}`, { records })
      return data
    },
  })
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent: 'Vắng mặt',
  excused: 'Nghỉ phép',
}

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  excused: 'bg-yellow-100 text-yellow-700',
}

export default function ClassDetailPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useClassDetail(unitId)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({})
  const [noteMap, setNoteMap] = useState<Record<number, string>>({})
  const [saved, setSaved] = useState(false)

  const { data: existingAttendance, isLoading: loadingAttendance } = useSessionAttendance(selectedSessionId)
  const submitAttendance = useSubmitAttendance()
  const [showOnlyUnmarked, setShowOnlyUnmarked] = useState(false)

  // When attendance loads, populate attendanceMap from existing data
  const loadedSessionId = selectedSessionId
  const prevAttendance = existingAttendance

  const handleSelectSession = useCallback(
    (sessionId: number) => {
      setSelectedSessionId(sessionId)
      setSaved(false)
      setAttendanceMap({})
      setNoteMap({})
    },
    [],
  )

  // Seed attendanceMap from existing records when they arrive
  const getStatus = (memberId: number): AttendanceStatus => {
    if (attendanceMap[memberId]) return attendanceMap[memberId]
    const existing = prevAttendance?.find((a) => a.memberId === memberId)
    return existing?.status ?? AttendanceStatus.ABSENT
  }

  const getNote = (memberId: number): string => {
    if (noteMap[memberId] !== undefined) return noteMap[memberId]
    const existing = prevAttendance?.find((a) => a.memberId === memberId)
    return existing?.note ?? ''
  }

  const toggleStatus = (memberId: number) => {
    const cur = getStatus(memberId)
    const next: AttendanceStatus =
      cur === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : cur === AttendanceStatus.ABSENT
          ? AttendanceStatus.EXCUSED
          : AttendanceStatus.PRESENT
    setAttendanceMap((prev) => ({ ...prev, [memberId]: next }))
  }

  const markAllPresent = () => {
    if (!data?.members) return
    const updated: Record<number, AttendanceStatus> = {}
    data.members.forEach((m) => {
      updated[m.id] = AttendanceStatus.PRESENT
    })
    setAttendanceMap(updated)
    toast.success(`Đã đánh dấu ${data.members.length} thành viên có mặt`)
  }

  const handleSave = async () => {
    if (!selectedSessionId || !data?.members) return
    const records: AttendanceRecord[] = data.members.map((m) => ({
      memberId: m.id,
      status: getStatus(m.id),
      note: getNote(m.id) || undefined,
    }))
    try {
      await submitAttendance.mutateAsync({ sessionId: selectedSessionId, records })
      toast.success('Đã lưu điểm danh thành công!')
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedSessionId] })
    } catch {
      toast.error('Lưu điểm danh thất bại. Thử lại.')
    }
  }

  const handleSessionCreated = () => {
    setShowCreateSession(false)
    toast.success('Tạo buổi sinh hoạt thành công!')
    queryClient.invalidateQueries({ queryKey: ['class-detail', unitId] })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const { unit, members, sessions } = data
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null

  // Track which members already have attendance records (for filter)
  const unmarkedCount = members.filter((m) => {
    return !attendanceMap[m.id] && !prevAttendance?.some((a) => a.memberId === m.id)
  }).length

  const presentCount = data.members.filter((m) => getStatus(m.id) === 'present').length
  const absentCount = data.members.filter((m) => getStatus(m.id) === 'absent').length
  const excusedCount = data.members.filter((m) => getStatus(m.id) === 'excused').length

  const filteredMembers = showOnlyUnmarked
    ? members.filter((m) => !attendanceMap[m.id] && !prevAttendance?.some((a) => a.memberId === m.id))
    : members

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/diem-danh">
          <Button variant="ghost" className="gap-2 px-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} đoàn sinh &middot; {sessions.length} buổi sinh hoạt
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setShowCreateSession(true)}
        >
          <Plus className="h-4 w-4" />
          Tạo buổi điểm danh
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowSchedule(true)}
        >
          <CalendarDays className="h-4 w-4" />
          Tạo lịch cả năm
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="h-4 w-4" />
            Buổi sinh hoạt ({sessions.length})
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500 text-sm">
                Chưa có buổi sinh hoạt nào.
                <br />
                <button
                  className="text-blue-600 underline mt-1"
                  onClick={() => setShowCreateSession(true)}
                >
                  Tạo buổi đầu tiên
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedSessionId === s.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 truncate">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(s.date)}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right: Attendance panel */}
        <div className="lg:col-span-2">
          {!selectedSessionId ? (
            <Card>
              <CardContent className="pt-12 text-center text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>Chọn một buổi sinh hoạt để bắt đầu điểm danh.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedSession?.title}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedSession?.date ?? '')}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowOnlyUnmarked((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      showOnlyUnmarked
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    Chưa điểm danh
                    {unmarkedCount > 0 && (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                        showOnlyUnmarked ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {unmarkedCount}
                      </span>
                    )}
                  </button>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-green-600 font-medium text-sm">{presentCount} Có mặt</span>
                    <span className="text-red-600 font-medium text-sm">{absentCount} Vắng mặt</span>
                    <span className="text-yellow-600 font-medium text-sm">{excusedCount} Nghỉ phép</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllPresent}
                    className="text-xs gap-1.5 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    Tất cả có mặt
                  </Button>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : filteredMembers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-sm text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    {showOnlyUnmarked ? 'Tất cả đã được điểm danh!' : 'Lớp này chưa có đoàn sinh nào.'}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop: table view */}
                  <div className="hidden md:block rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-700">Họ và tên</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-700">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMembers.map((member) => {
                          const status = getStatus(member.id)
                          return (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{member.fullName}</p>
                                {member.baptismName && (
                                  <p className="text-xs text-gray-400">{member.baptismName}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => toggleStatus(member.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${STATUS_COLOR[status]}`}
                                >
                                  {STATUS_LABEL[status]}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={getNote(member.id)}
                                  onChange={(e) =>
                                    setNoteMap((prev) => ({ ...prev, [member.id]: e.target.value }))
                                  }
                                  placeholder="Lý do..."
                                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card-based list */}
                  <div className="md:hidden space-y-3">
                    {filteredMembers.map((member) => {
                      const status = getStatus(member.id)
                      return (
                        <Card key={member.id} className="border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{member.fullName}</p>
                                {member.baptismName && (
                                  <p className="text-xs text-gray-400">{member.baptismName}</p>
                                )}
                              </div>
                              <button
                                onClick={() => toggleStatus(member.id)}
                                className={`px-3 py-2 rounded-full text-xs font-semibold transition-colors min-w-[80px] text-center ${STATUS_COLOR[status]}`}
                              >
                                {STATUS_LABEL[status]}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={getNote(member.id)}
                              onChange={(e) =>
                                setNoteMap((prev) => ({ ...prev, [member.id]: e.target.value }))
                              }
                              placeholder="Lý do..."
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 min-h-[44px]"
                            />
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}

              {filteredMembers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {saved && (
                    <p className="text-green-600 text-sm font-medium">Đã lưu thành công!</p>
                  )}
                  {!saved && <div />}
                  <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <a
                      href={`http://localhost:3002/api/attendance-report/class/${unit.id}/members/export`}
                      download
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      <span>DS Excel</span>
                    </a>
                    <a
                      href={`http://localhost:3002/api/attendance-report/class/${unit.id}/export`}
                      download
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      <span>Báo cáo</span>
                    </a>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={submitAttendance.isPending}
                      disabled={submitAttendance.isPending}
                      className="flex-1 sm:flex-none min-h-[44px]"
                    >
                      Lưu điểm danh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateSession && (
        <CreateSessionModal
          onClose={handleSessionCreated}
          defaultUnitId={unit.id}
        />
      )}
      {showSchedule && (
        <SessionScheduleModal
          unitId={unit.id}
          onClose={() => {
            setShowSchedule(false)
            queryClient.invalidateQueries({ queryKey: ['class-detail', unitId] })
          }}
        />
      )}
    </div>
  )
}

