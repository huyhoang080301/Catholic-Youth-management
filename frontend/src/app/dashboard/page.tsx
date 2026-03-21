'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useSessions } from '@/hooks/use-attendance'
import { Spinner } from '@/components/ui/spinner'
import { CalendarDays } from 'lucide-react'

export default function DashboardPage() {
  const { data: sessions, isLoading } = useSessions()
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions?.find((s) => s.date === today || s.date?.startsWith(today))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {formatDate(today)}
        </p>
      </div>

      {todaySession ? (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Buổi sinh hoạt hôm nay</h2>
          </CardHeader>
          <CardContent className="space-y-4">
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
            {todaySession.description && (
              <div>
                <p className="text-sm text-gray-600">Mô tả:</p>
                <p className="font-semibold text-gray-900">{todaySession.description}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Tổng thành viên</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Buổi sinh hoạt tháng này</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {sessions?.filter((s) => {
                const month = new Date(s.date).getMonth()
                const currentMonth = new Date().getMonth()
                return month === currentMonth
              }).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Tham dự hôm nay</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0%</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Buổi sinh hoạt gần đây</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
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
                      <Button variant="outline" size="sm">
                        Chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Chưa có buổi sinh hoạt nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
