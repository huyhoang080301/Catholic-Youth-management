'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { OrganizationUnit, SessionType, Session, Branch } from '@/types'

const BRANCH_LABELS: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

interface CreateSessionForm {
  title: string
  date: string
  description: string
  organizationUnitId: string
  sessionType: SessionType
  teamIds: number[]
}

interface CreateSessionModalProps {
  onClose: () => void
  defaultUnitId?: number
  defaultSessionType?: SessionType
  editingSession?: Session
}

export function CreateSessionModal({
  onClose,
  defaultUnitId,
  defaultSessionType,
  editingSession,
}: CreateSessionModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateSessionForm>({
    title: editingSession?.title ?? '',
    date: editingSession?.date ? editingSession.date.split('T')[0] : '',
    description: editingSession?.description ?? '',
    organizationUnitId: editingSession?.organizationUnitId
      ? String(editingSession.organizationUnitId)
      : defaultUnitId
        ? String(defaultUnitId)
        : '',
    sessionType: editingSession?.sessionType ?? defaultSessionType ?? 'class',
    teamIds: editingSession?.teamIds ?? [],
  })
  const [teamBranchFilter, setTeamBranchFilter] = useState<string>('')
  const [error, setError] = useState('')

  // Keep local error for inline validation only (toast handles API errors)

  const { data: units } = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  const classUnits = units?.filter((u) => u.type === 'lop') ?? []
  const allTeams = units?.filter((u) => u.type === 'doi') ?? []
  const teams = teamBranchFilter
    ? allTeams.filter((t) => t.branch === teamBranchFilter)
    : allTeams

  const toggleTeam = (teamId: number) => {
    setForm((prev) => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter((id) => id !== teamId)
        : [...prev.teamIds, teamId],
    }))
  }

  const isEditing = !!editingSession

  const saveSession = useMutation({
    mutationFn: async (data: CreateSessionForm) => {
      const payload: Record<string, unknown> = {
        title: data.title,
        date: data.date,
        sessionType: data.sessionType,
      }
      if (data.description) payload.description = data.description
      if (data.organizationUnitId) payload.organizationUnitId = Number(data.organizationUnitId)
      if (data.sessionType === 'general' && data.teamIds.length > 0) {
        payload.teamIds = data.teamIds
      }
      if (isEditing) {
        const { data: res } = await api.patch(`/sessions/${editingSession.id}`, payload)
        return res
      } else {
        const { data: res } = await api.post('/sessions', payload)
        return res
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Đã cập nhật buổi sinh hoạt!' : 'Đã tạo buổi sinh hoạt!')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra'
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.date) {
      setError('Tên buổi và ngày là bắt buộc')
      return
    }
    if (form.sessionType === 'general' && form.teamIds.length === 0) {
      setError('Vui lòng chọn ít nhất một tổ cho buổi sinh hoạt chung.')
      return
    }
    saveSession.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md md:mt-8 mt-4 mb-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Chỉnh sửa buổi sinh hoạt' : 'Tạo buổi sinh hoạt mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Session type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại buổi sinh hoạt *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, sessionType: 'class', teamIds: [] })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.sessionType === 'class'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                Theo lớp
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, sessionType: 'general', organizationUnitId: '', teamIds: [] })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.sessionType === 'general'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                }`}
              >
                Sinh hoạt chung
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi sinh hoạt *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.sessionType === 'class' ? 'Sinh hoạt Chúa Nhật tuần 1' : 'Sinh hoạt chung toàn đoàn'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {form.sessionType === 'class' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
              <select
                value={form.organizationUnitId}
                onChange={(e) => setForm({ ...form, organizationUnitId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Chọn lớp --</option>
                {classUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          )}

          {form.sessionType === 'general' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn tổ ({form.teamIds.length} tổ)
              </label>
              {/* Branch filter */}
              <div className="flex gap-1 flex-wrap mb-2">
                <button
                  type="button"
                  onClick={() => setTeamBranchFilter('')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    !teamBranchFilter
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                {Object.entries(BRANCH_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTeamBranchFilter(value)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      teamBranchFilter === value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {teams.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  {teamBranchFilter
                    ? `Chưa có tổ ngành "${BRANCH_LABELS[teamBranchFilter] || teamBranchFilter}".`
                    : 'Chưa có tổ nào. Vui lòng tạo tổ trước.'}
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  {teams.map((team) => {
                    const isSelected = form.teamIds.includes(team.id)
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggleTeam(team.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-orange-50 text-orange-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                          isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {team.name}
                        {team.branch && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {BRANCH_LABELS[team.branch] ?? team.branch}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả buổi sinh hoạt..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={saveSession.isPending}
              disabled={saveSession.isPending}
            >
              {isEditing ? 'Cập nhật' : 'Tạo buổi sinh hoạt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
