'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Session } from '@/types'

interface SessionCardProps {
  session: Session
  presentCount?: number
  absentCount?: number
  excusedCount?: number
  totalCount?: number
}

export function SessionCard({
  session,
  presentCount = 0,
  absentCount = 0,
  excusedCount = 0,
  totalCount = 0,
}: SessionCardProps) {
  const unitName = session.organizationUnit?.name ?? session.title

  return (
    <Link href={`/dashboard/diem-danh/${session.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{session.title}</h3>
                {unitName !== session.title && (
                  <p className="text-xs text-gray-500 mt-0.5">{unitName}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">{formatDate(session.date)}</p>
              </div>
              <Badge variant="info">{formatDate(session.date)}</Badge>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm">
                  <p className="text-green-600 font-medium">{presentCount} có mặt</p>
                  <p className="text-red-600 font-medium">{absentCount} vắng mặt</p>
                  <p className="text-yellow-600 font-medium">{excusedCount} nghỉ phép</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  <p className="text-xs text-gray-500">tổng cộng</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
