'use client'

import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SessionCard } from '@/components/attendance/session-card'
import { useSessions } from '@/hooks/use-attendance'
import { Spinner } from '@/components/ui/spinner'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { CreateSessionModal } from '@/components/common/create-session-modal'
import { Plus, Users, Calendar } from 'lucide-react'
import { OrganizationUnit } from '@/types'

type Tab = 'buoi' | 'lop'

function useClasses() {
  return useQuery({
    queryKey: ['classes-for-attendance'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })
}

const BRANCH_LABEL: Record<string, string> = {
  chien_con: 'Chien Con',
  au_nhi: 'Au Nhi',
  thieu_nhi: 'Thieu Nhi',
  nghia_si: 'Nghia Si',
  hiep_si: 'Hiep Si',
}
const TYPE_LABEL: Record<string, string> = {
  xu_doan: 'Xu Doan',
  phan_doan: 'Phan Doan',
  chi_doan: 'Chi Doan',
  lop: 'Lop',
  doi: 'Doi',
}

function ClassCard({ unit }: { unit: OrganizationUnit }) {
  return (
    <Link href={`/dashboard/diem-danh/lop/${unit.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{unit.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {TYPE_LABEL[unit.type] ?? unit.type}
                {unit.branch ? ` · ${BRANCH_LABEL[unit.branch] ?? unit.branch}` : ''}
              </p>
              {unit.description && (
                <p className="text-xs text-gray-400 mt-1 truncate">{unit.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-blue-600 font-medium">Xem chi tiet va diem danh →</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DiemDanhPage() {
  const { data: sessions, isLoading: loadingSessions } = useSessions()
  const { data: classes, isLoading: loadingClasses } = useClasses()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tab, setTab] = useState<Tab>('lop')

  const sortedSessions = sessions?.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diem danh</h1>
          <p className="text-gray-600 mt-1">Quan ly diem danh buoi sinh hoat</p>
        </div>
        <div className="flex items-center gap-3">
          {tab === 'buoi' && (
            <ExcelImportButton
              uploadUrl="/sessions/import"
              label="Import Excel"
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
            />
          )}
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-5 w-5" />
            Tao buoi sinh hoat
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('lop')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'lop'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Theo lop hoc
        </button>
        <button
          onClick={() => setTab('buoi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'buoi'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Theo buoi sinh hoat
        </button>
      </div>

      {/* Tab: By class */}
      {tab === 'lop' && (
        <>
          {loadingClasses ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : classes && classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((unit) => (
                <ClassCard key={unit.id} unit={unit} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12">
                <div className="text-center space-y-3">
                  <Users className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-gray-600">Chua co lop hoc nao.</p>
                  <p className="text-gray-400 text-sm">
                    Vao <strong>To chuc</strong> de tao cac lop hoc truoc.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Tab: By session */}
      {tab === 'buoi' && (
        <>
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-medium mb-1">Dinh dang Excel (cac cot can co):</p>
            <p>title | date (YYYY-MM-DD) | orgUnitId | description (tuy chon)</p>
          </div>

          {loadingSessions ? (
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
                  <p className="text-gray-600 text-lg">Chua co buoi sinh hoat nao</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Tao buoi sinh hoat dau tien
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateSessionModal onClose={() => {
          setShowCreateModal(false)
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
        }} />
      )}
    </div>
  )
}

