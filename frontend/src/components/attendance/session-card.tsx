'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
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
  onEdit?: (session: Session) => void
  onDelete?: (session: Session) => void
}

export function SessionCard({
  session,
  presentCount = 0,
  absentCount = 0,
  excusedCount = 0,
  totalCount = 0,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const unitName = session.organizationUnit?.name ?? session.title

  const handleEdit = (e: React.MouseEvent) => {
    if (onEdit) {
      e.preventDefault()
      e.stopPropagation()
      onEdit(session)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault()
      e.stopPropagation()
      onDelete(session)
    }
  }

  return (
    <div className="relative">
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
                    <p className="text-green-600 font-medium">{presentCount} Có mặt</p>
                    <p className="text-red-600 font-medium">{absentCount} Vắng mặt</p>
                    <p className="text-yellow-600 font-medium">{excusedCount} Nghỉ phép</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                    <p className="text-xs text-gray-500">Tổng cộng</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
      <div className="absolute top-3 right-3 flex gap-1">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors shadow-sm"
            title="Chỉnh sửa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-red-600 transition-colors shadow-sm"
            title="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
