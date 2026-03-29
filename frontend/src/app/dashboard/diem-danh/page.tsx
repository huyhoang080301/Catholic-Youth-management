'use client'

import { useState } from 'react'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SessionCard } from '@/components/attendance/session-card'
import { useSessions } from '@/hooks/use-attendance'
import { Spinner } from '@/components/ui/spinner'
import { ExcelImportButton } from '@/components/common/excel-import-button'
import { CreateSessionModal } from '@/components/common/create-session-modal'
import { Plus, Users, Calendar, Globe, Pencil, Trash2 } from 'lucide-react'
import { OrganizationUnit, Session } from '@/types'

type Tab = 'lop' | 'buoi' | 'chung'

const BRANCH_LABEL: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

const TYPE_LABEL: Record<string, string> = {
  xu_doan: 'Xứ đoàn',
  phan_doan: 'Phân đoàn',
  chi_doan: 'Chi đoàn',
  lop: 'Lớp',
  doi: 'Đội',
}

function useClasses() {
  return useQuery({
    queryKey: ['classes-for-attendance'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })
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
            <p className="text-xs text-blue-600 font-medium">Xem chi tiết và điểm danh →</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function GeneralSessionCard({ session, onEdit, onDelete }: { session: Session; onEdit?: (s: Session) => void; onDelete?: (s: Session) => void }) {
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {session.description && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{session.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-orange-600 font-medium">Xem chi tiết điểm danh →</p>
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

export default function DiemDanhPage() {
  const { data: sessions, isLoading: loadingSessions } = useSessions()
  const { data: classes, isLoading: loadingClasses } = useClasses()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [defaultSessionType, setDefaultSessionType] = useState<'class' | 'general'>('class')
  const [tab, setTab] = useState<Tab>('lop')

  const classSessions = sessions?.filter((s) => s.sessionType === 'class' || !s.sessionType) ?? []
  const generalSessions = sessions?.filter((s) => s.sessionType === 'general') ?? []

  const sortedClassSessions = classSessions.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const sortedGeneralSessions = generalSessions.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const openCreateModal = (type: 'class' | 'general') => {
    setDefaultSessionType(type)
    setShowCreateModal(true)
  }

  const deleteSession = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sessions/${id}`)
    },
    onSuccess: () => {
      toast.success('Đã xóa buổi sinh hoạt')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Điểm danh</h1>
          <p className="text-gray-600 mt-1">Quản lý điểm danh buổi sinh hoạt</p>
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
            onClick={() => openCreateModal(tab === 'chung' ? 'general' : 'class')}
          >
            <Plus className="h-5 w-5" />
            Tạo buổi sinh hoạt
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
          Theo lớp học
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
          Theo buổi sinh hoạt
        </button>
        <button
          onClick={() => setTab('chung')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'chung'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="h-4 w-4" />
          Sinh hoạt chung
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
                  <p className="text-gray-600">Chưa có lớp học nào.</p>
                  <p className="text-gray-400 text-sm">
                    Vào <strong>Tổ chức</strong> để tạo các lớp học trước.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Tab: By session (class sessions) */}
      {tab === 'buoi' && (
        <>
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-medium mb-1">Định dạng Excel (các cột cần có):</p>
            <p>title | date (YYYY-MM-DD) | orgUnitId | description (tùy chọn)</p>
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : sortedClassSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedClassSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  presentCount={0}
                  absentCount={0}
                  excusedCount={0}
                  totalCount={0}
                  onEdit={(s) => {
                    setEditingSession(s)
                    setShowCreateModal(true)
                  }}
                  onDelete={(s) => {
                    if (confirm(`Xác nhận xóa buổi sinh hoạt "${s.title}"?`)) {
                      deleteSession.mutate(s.id)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12">
                <div className="text-center space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 text-lg">Chưa có buổi sinh hoạt lớp nào.</p>
                  <Button variant="primary" onClick={() => openCreateModal('class')}>
                    Tạo buổi đầu tiên
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Tab: General sessions */}
      {tab === 'chung' && (
        <>
          <div className="text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p>Buổi sinh hoạt chung — điểm danh theo đội, bao gồm đoàn sinh từ nhiều ngành.</p>
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : sortedGeneralSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedGeneralSessions.map((session) => (
                <GeneralSessionCard
                  key={session.id}
                  session={session}
                  onEdit={(s) => {
                    setEditingSession(s)
                    setShowCreateModal(true)
                  }}
                  onDelete={(s) => {
                    if (confirm(`Xác nhận xóa buổi sinh hoạt "${s.title}"?`)) {
                      deleteSession.mutate(s.id)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12">
                <div className="text-center space-y-4">
                  <Globe className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 text-lg">Chưa có buổi sinh hoạt chung nào.</p>
                  <Button variant="primary" onClick={() => openCreateModal('general')}>
                    Tạo buổi sinh hoạt chung đầu tiên
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateSessionModal
          defaultSessionType={defaultSessionType}
          editingSession={editingSession ?? undefined}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSession(null)
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
          }}
        />
      )}
    </div>
  )
}
