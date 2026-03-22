'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'
import { UnitType, Branch, TeamType, Member } from '@/types'

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  xu_doan: 'Xứ đoàn',
  phan_doan: 'Phân đoàn',
  chi_doan: 'Chi đoàn',
  lop: 'Lớp',
  doi: 'Đội',
}

const BRANCH_LABELS: Record<Branch, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

interface CreateOrgUnitModalProps {
  onClose: () => void
  defaultType?: UnitType
  defaultParentId?: number
}

export function CreateOrgUnitModal({ onClose, defaultType, defaultParentId }: CreateOrgUnitModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    type: (defaultType ?? 'lop') as UnitType,
    branch: '' as Branch | '',
    parentId: defaultParentId ? String(defaultParentId) : '',
    description: '',
    teamType: '' as TeamType | '',
    leaderId: '' as string,
    deputyId: '' as string,
    memberIds: [] as number[],
  })
  const [memberSearch, setMemberSearch] = useState('')
  const [error, setError] = useState('')

  const { data: allUnits } = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => {
      const { data } = await api.get<{ id: number; name: string; type: UnitType; branch?: Branch }[]>('/organization')
      return Array.isArray(data) ? data : (data as { data: unknown[] }).data ?? []
    },
  })

  const { data: allMembers } = useQuery({
    queryKey: ['members-simple'],
    queryFn: async () => {
      const { data } = await api.get<Member[] | { data: Member[] }>('/members?limit=1000')
      return Array.isArray(data) ? data : (data as { data: Member[] }).data ?? []
    },
  })

  const isTeam = form.type === 'doi'
  const parentUnits = allUnits?.filter((u) => {
    if (form.type === 'lop' || form.type === 'doi') return u.type === 'chi_doan' || u.type === 'phan_doan' || u.type === 'xu_doan'
    if (form.type === 'chi_doan') return u.type === 'phan_doan' || u.type === 'xu_doan'
    if (form.type === 'phan_doan') return u.type === 'xu_doan'
    return false
  }) ?? []

  // Members selectable for the team (if type=doi)
  const filteredMembers = allMembers?.filter((m) =>
    !memberSearch || m.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  ) ?? []

  // Candidates for leader/deputy must be in selected memberIds (for teams)
  const selectedMembers = allMembers?.filter((m) => form.memberIds.includes(m.id)) ?? []
  const leaderDeputyCandidates = isTeam ? selectedMembers : (allMembers ?? [])

  const toggleMember = (id: number) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
      // Clear leader/deputy if they're removed from team
      leaderId: prev.leaderId && !prev.memberIds.includes(Number(prev.leaderId)) ? '' : prev.leaderId,
      deputyId: prev.deputyId && !prev.memberIds.includes(Number(prev.deputyId)) ? '' : prev.deputyId,
    }))
  }

  const createUnit = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
      }
      if (form.branch) payload.branch = form.branch
      if (form.parentId) payload.parentId = Number(form.parentId)
      if (form.description) payload.description = form.description
      if (form.teamType) payload.teamType = form.teamType
      if (form.leaderId) payload.leaderId = Number(form.leaderId)
      if (form.deputyId) payload.deputyId = Number(form.deputyId)
      if (form.memberIds.length > 0) payload.memberIds = form.memberIds
      const { data } = await api.post('/organization', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-units'] })
      queryClient.invalidateQueries({ queryKey: ['org-units'] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name) {
      setError('Tên đơn vị là bắt buộc')
      return
    }
    if (isTeam && !form.teamType) {
      setError('Chọn loại đội')
      return
    }
    createUnit.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Thêm đơn vị tổ chức</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Unit type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn vị *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as UnitType, memberIds: [], leaderId: '', deputyId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {(Object.entries(UNIT_TYPE_LABELS) as [UnitType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đơn vị *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isTeam ? 'Đội Thánh Giuse' : 'Lớp Thiếu Nhi A'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Team type - only for doi */}
          {isTeam && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại đội *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, teamType: 'in_branch' })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.teamType === 'in_branch'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  Trong ngành
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
                  Liên ngành
                </button>
              </div>
            </div>
          )}

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value as Branch | '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Chọn ngành --</option>
              {(Object.entries(BRANCH_LABELS) as [Branch, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Parent unit */}
          {parentUnits.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị cha</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Chọn đơn vị cha --</option>
                {parentUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Member selection (for teams) */}
          {isTeam && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thành viên đội ({form.memberIds.length} đã chọn)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Tìm kiếm đoàn sinh..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3 text-center">Không tìm thấy đoàn sinh</p>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMember(m.id)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        form.memberIds.includes(m.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(m.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-900">{m.fullName}</span>
                      {m.baptismName && (
                        <span className="text-xs text-gray-400">{m.baptismName}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Leader / Deputy */}
          {(isTeam ? form.memberIds.length > 0 : true) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng</label>
                <select
                  value={form.leaderId}
                  onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">-- Chọn trưởng --</option>
                  {leaderDeputyCandidates.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phó</label>
                <select
                  value={form.deputyId}
                  onChange={(e) => setForm({ ...form, deputyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">-- Chọn phó --</option>
                  {leaderDeputyCandidates
                    .filter((m) => !form.leaderId || m.id !== Number(form.leaderId))
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả thêm..."
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
              isLoading={createUnit.isPending}
              disabled={createUnit.isPending}
            >
              Thêm đơn vị
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
