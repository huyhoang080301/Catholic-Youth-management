'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Plus, Calendar, Users } from 'lucide-react'
import { OrganizationUnit, Member, Session, Attendance, AttendanceStatus, AttendanceRecord } from '@/types'
import { CreateSessionModal } from '@/components/common/create-session-modal'
import { AttendanceList } from '@/components/attendance/attendance-list'

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
  present: 'Co mat',
  absent: 'Vang',
  excused: 'Phep',
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
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({})
  const [noteMap, setNoteMap] = useState<Record<number, string>>({})
  const [saved, setSaved] = useState(false)

  const { data: existingAttendance, isLoading: loadingAttendance } = useSessionAttendance(selectedSessionId)
  const submitAttendance = useSubmitAttendance()

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
    return existing?.status ?? 'absent'
  }

  const getNote = (memberId: number): string => {
    if (noteMap[memberId] !== undefined) return noteMap[memberId]
    const existing = prevAttendance?.find((a) => a.memberId === memberId)
    return existing?.note ?? ''
  }

  const toggleStatus = (memberId: number) => {
    const cur = getStatus(memberId)
    const next: AttendanceStatus = cur === 'present' ? 'absent' : cur === 'absent' ? 'excused' : 'present'
    setAttendanceMap((prev) => ({ ...prev, [memberId]: next }))
  }

  const handleSave = async () => {
    if (!selectedSessionId || !data?.members) return
    const records: AttendanceRecord[] = data.members.map((m) => ({
      memberId: m.id,
      status: getStatus(m.id),
      note: getNote(m.id) || undefined,
    }))
    await submitAttendance.mutateAsync({ sessionId: selectedSessionId, records })
    setSaved(true)
    queryClient.invalidateQueries({ queryKey: ['attendance', selectedSessionId] })
  }

  const handleSessionCreated = () => {
    setShowCreateSession(false)
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

  const presentCount = data.members.filter((m) => getStatus(m.id) === 'present').length
  const absentCount = data.members.filter((m) => getStatus(m.id) === 'absent').length
  const excusedCount = data.members.filter((m) => getStatus(m.id) === 'excused').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/diem-danh">
          <Button variant="ghost" className="gap-2 px-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lai
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} doan sinh &middot; {sessions.length} buoi sinh hoat
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setShowCreateSession(true)}
        >
          <Plus className="h-4 w-4" />
          Tao buoi diem danh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="h-4 w-4" />
            Buoi sinh hoat ({sessions.length})
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500 text-sm">
                Chua co buoi sinh hoat nao.
                <br />
                <button
                  className="text-blue-600 underline mt-1"
                  onClick={() => setShowCreateSession(true)}
                >
                  Tao buoi dau tien
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
                <p>Chon mot buoi sinh hoat de bat dau diem danh</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedSession?.title}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedSession?.date ?? '')}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-600 font-medium">{presentCount} co mat</span>
                  <span className="text-red-600 font-medium">{absentCount} vang</span>
                  <span className="text-yellow-600 font-medium">{excusedCount} phep</span>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : members.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-sm text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    Lop nay chua co doan sinh nao.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Ho va ten</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-700">Trang thai</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Ghi chu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {members.map((member) => {
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
                                placeholder="Ly do..."
                                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {members.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  {saved && (
                    <p className="text-green-600 text-sm font-medium">Da luu thanh cong!</p>
                  )}
                  <div className="ml-auto">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={submitAttendance.isPending}
                      disabled={submitAttendance.isPending}
                    >
                      Luu diem danh
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
    </div>
  )
}

