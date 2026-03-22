'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useSessions } from '@/hooks/use-attendance'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { CalendarDays, Users, BookOpen, Shield, ChevronRight } from 'lucide-react'

const BRANCH_LABEL: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

interface ClassStat {
  id: number
  name: string
  branch: string
  memberCount: number
  presentRate: number
}

interface TeamStat {
  id: number
  name: string
  branch: string
  memberCount: number
  members: { id: number; fullName: string }[]
}

interface OrgStats {
  totalClasses: number
  totalTeams: number
  totalMembers: number
  classes: ClassStat[]
  teams: TeamStat[]
}

function useOrgStats() {
  return useQuery<OrgStats>({
    queryKey: ['org-stats'],
    queryFn: async () => {
      const { data } = await api.get<OrgStats>('/organization/stats')
      return data
    },
  })
}

export default function DashboardPage() {
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const { data: stats, isLoading: statsLoading } = useOrgStats()
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions?.find((s) => s.date === today || s.date?.startsWith(today))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {formatDate(today)}
        </p>
      </div>

      {/* Today session */}
      {todaySession ? (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Buổi sinh hoạt hôm nay</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Tên buổi:</p>
              <p className="font-semibold text-gray-900">{todaySession.title}</p>
            </div>
            {todaySession.organizationUnit && (
              <div>
                <p className="text-sm text-gray-600">Đơn vị:</p>
                <p className="font-semibold text-gray-900">{todaySession.organizationUnit.name}</p>
              </div>
            )}
            <Link href={`/dashboard/diem-danh/${todaySession.id}`}>
              <Button className="w-full">Điểm danh ngay</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Không có buổi sinh hoạt được lên lịch cho hôm nay
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Tổng đoàn sinh</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? '--' : (stats?.totalMembers ?? '--')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Số lớp</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? '--' : (stats?.totalClasses ?? '--')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Số đội</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? '--' : (stats?.totalTeams ?? '--')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Buổi tháng này</p>
                <p className="text-3xl font-bold text-gray-900">
                  {sessions?.filter((s) => {
                    const month = new Date(s.date).getMonth()
                    const currentMonth = new Date().getMonth()
                    return month === currentMonth
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Danh sach lop hoc</h2>
          <Link href="/dashboard/diem-danh">
            <Button variant="outline" size="sm">Xem tat ca</Button>
          </Link>
        </div>
        {statsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : stats?.classes && stats.classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.classes.map((cls) => (
              <Link key={cls.id} href={`/dashboard/diem-danh/lop/${cls.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border hover:border-blue-300">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-gray-900">{cls.name}</p>
                        {cls.branch && (
                          <Badge variant="secondary" className="text-xs">
                            {BRANCH_LABEL[cls.branch] || cls.branch}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 mt-1 shrink-0" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{cls.memberCount}</p>
                        <p className="text-xs text-gray-500">doan sinh</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{cls.presentRate}%</p>
                        <p className="text-xs text-gray-500">diem danh (30 ngay)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Chua co lop hoc nao</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teams section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Danh sach doi</h2>
          <Link href="/dashboard/to-chuc">
            <Button variant="outline" size="sm">Quan ly to chuc</Button>
          </Link>
        </div>
        {statsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : stats?.teams && stats.teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.teams.map((team) => (
              <Card key={team.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{team.name}</p>
                      {team.branch && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {BRANCH_LABEL[team.branch] || team.branch}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{team.memberCount}</p>
                      <p className="text-xs text-gray-500">thanh vien</p>
                    </div>
                  </div>
                  {team.members.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {team.members.map((m, idx) => (
                        <Link key={m.id} href={`/dashboard/thanh-vien/${m.id}`}>
                          <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                            <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                            <span className="text-sm text-gray-800">{m.fullName}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Chua co doi nao</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Buoi sinh hoat gan day</h2>
        {sessionsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <Link key={session.id} href={`/dashboard/diem-danh/${session.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{session.title}</p>
                        {session.organizationUnit && (
                          <p className="text-xs text-gray-500">{session.organizationUnit.name}</p>
                        )}
                        <p className="text-sm text-gray-600">{formatDate(session.date)}</p>
                      </div>
                      <Button variant="outline" size="sm">Chi tiet</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Chua co buoi sinh hoat nao</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
