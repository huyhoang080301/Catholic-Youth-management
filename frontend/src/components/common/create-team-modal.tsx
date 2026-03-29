'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Branch, TeamType, OrganizationUnit, Member } from '@/types'

const BRANCH_LABELS: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

interface CreateTeamForm {
  name: string
  branch: Branch | ''
  teamType: TeamType
  leaderId: string
  deputyId: string
  description: string
  code: string
}

export function CreateTeamModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateTeamForm>({
    name: '',
    branch: '',
    teamType: 'in_branch',
    leaderId: '',
    deputyId: '',
    description: '',
    code: '',
  })
  const [memberIds, setMemberIds] = useState<number[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [error, setError] = useState('')

  // Fetch all classes for selecting members
  const { data: allUnits } = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  // Fetch members of selected class
  const { data: unitMembers = [] } = useQuery({
    queryKey: ['unit-members', selectedUnitId],
    queryFn: async () => {
      if (!selectedUnitId) return []
      const { data } = await api.get<Member[] | { data: Member[] }>(`/organization/${selectedUnitId}/members`)
      return Array.isArray(data) ? data : (data as { data: Member[] }).data ?? []
    },
    enabled: !!selectedUnitId,
  })

  // Fetch all members for leader/deputy selection
  const { data: allMembers = [] } = useQuery({
    queryKey: ['members-simple'],
    queryFn: async () => {
      const { data } = await api.get<Member[] | { data: Member[] }>('/members?limit=1000')
      return Array.isArray(data) ? data : (data as { data: Member[] }).data ?? []
    },
  })

  const classUnits = allUnits?.filter((u) => u.type === 'lop') ?? []
  const leaderDeputyCandidates = allMembers

  const createTeam = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        teamType: form.teamType,
        type: 'doi',
      }
      if (form.branch) payload.branch = form.branch
      if (form.description) payload.description = form.description
      if (form.code) payload.code = form.code
      if (form.leaderId) payload.leaderId = Number(form.leaderId)
      if (form.deputyId) payload.deputyId = Number(form.deputyId)
      if (memberIds.length > 0) payload.memberIds = memberIds
      const { data } = await api.post('/organization', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Đã tạo đội thành công!')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] })
      queryClient.invalidateQueries({ queryKey: ['organization-units'] })
      queryClient.invalidateQueries({ queryKey: ['org-units-all'] })
      onClose()
    },
    onError: (err: unknown) => {
      toast.error('Tạo đội thất bại. Thử lại.')
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const toggleMember = (memberId: number) => {
    setMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name) {
      setError('Tên đội là bắt buộc')
      return
    }
    if (form.leaderId && !memberIds.includes(Number(form.leaderId))) {
      setError('Trưởng đội phải là thành viên của đội. Vui lòng chọn trưởng đội từ danh sách thành viên đã thêm.')
      return
    }
    if (form.deputyId && !memberIds.includes(Number(form.deputyId))) {
      setError('Phó đội phải là thành viên của đội. Vui lòng chọn phó đội từ danh sách thành viên đã thêm.')
      return
    }
    createTeam.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Tạo đội mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đội *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Đội Trưởng 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đội</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="VD: DOI-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngành</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BRANCH_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, branch: value as Branch })}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.branch === value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại đội</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, teamType: 'in_branch' })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.teamType === 'in_branch'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                Trong chi đoàn
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, teamType: 'cross_branch' })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.teamType === 'cross_branch'
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                Liên chi đoàn
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp để thêm thành viên</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn lớp --</option>
              {classUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {unitMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thành viên ({memberIds.length} đã chọn)
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {unitMembers.map((m) => {
                  const isSelected = memberIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        isSelected ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {m.fullName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng đội</label>
            <select
              value={form.leaderId}
              onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn trưởng đội --</option>
              {leaderDeputyCandidates.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phó đội</label>
            <select
              value={form.deputyId}
              onChange={(e) => setForm({ ...form, deputyId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn phó đội --</option>
              {leaderDeputyCandidates.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả đội..."
              rows={2}
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
              isLoading={createTeam.isPending}
              disabled={createTeam.isPending}
            >
              Tạo đội
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
