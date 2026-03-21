'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SessionCard } from '@/components/attendance/session-card'
import { useSessions } from '@/hooks/use-attendance'
import { Spinner } from '@/components/ui/spinner'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { CreateSessionModal } from '@/components/common/create-session-modal'
import { Plus } from 'lucide-react'

export default function DiemDanhPage() {
  const { data: sessions, isLoading } = useSessions()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const sortedSessions = sessions?.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Điểm danh</h1>
          <p className="text-gray-600 mt-1">Quản lý điểm danh buổi sinh hoạt</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImportButton
            uploadUrl="/sessions/import"
            label="Import Excel"
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
          />
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-5 w-5" />
            Tạo buổi sinh hoạt
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="font-medium mb-1">Định dạng Excel (các cột cần có):</p>
        <p>title | date (YYYY-MM-DD) | orgUnitId | description (tùy chọn)</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : sortedSessions && sortedSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              presentCount={0}
              absentCount={0}
              excusedCount={0}
              totalCount={0}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-lg">Chưa có buổi sinh hoạt nào</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Tạo buổi sinh hoạt đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateSessionModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
