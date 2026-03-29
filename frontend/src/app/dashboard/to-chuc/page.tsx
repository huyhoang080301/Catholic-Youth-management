'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { OrganizationUnit } from '@/types'
import { ChevronRight, ChevronDown, Plus, Users, Crown, Star, Shield, Pencil, Trash2 } from 'lucide-react'
import { CreateOrgUnitModal } from '@/components/common/create-org-unit-modal'
import { CreateTeamModal } from '@/components/common/create-team-modal'

const UNIT_TYPE_LABELS: Record<string, string> = {
  xu_doan: 'Xứ đoàn',
  phan_doan: 'Phân đoàn',
  chi_doan: 'Chi đoàn',
  lop: 'Lớp',
  doi: 'Đội',
}

const BRANCH_LABELS: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

const TEAM_TYPE_LABELS: Record<string, string> = {
  in_branch: 'Trong ngành',
  cross_branch: 'Liên ngành',
}

interface UnitTreeNodeProps {
  unit: OrganizationUnit
  level?: number
  onEdit: (unit: OrganizationUnit) => void
  onDelete: (unit: OrganizationUnit) => void
}

function UnitTreeNode({ unit, level = 0, onEdit, onDelete }: UnitTreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = unit.children && unit.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-3 px-4 hover:bg-gray-50 border-b border-gray-100 ${hasChildren ? 'cursor-pointer' : ''}`}
        style={{ paddingLeft: `${level * 20 + 16}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="mt-0.5">
          {hasChildren ? (
            expanded
              ? <ChevronDown className="h-4 w-4 text-gray-400" />
              : <ChevronRight className="h-4 w-4 text-gray-400" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-medium text-gray-900">{unit.name}</span>
            {unit.type && (
              <Badge variant="default" className="text-xs">
                {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
              </Badge>
            )}
            {unit.branch && (
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">
                {BRANCH_LABELS[unit.branch] ?? unit.branch}
              </Badge>
            )}
            {unit.teamType && (
              <Badge variant="default" className={`text-xs ${unit.teamType === 'cross_branch' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {TEAM_TYPE_LABELS[unit.teamType]}
              </Badge>
            )}
          </div>
          {(unit.leader || unit.deputy) && (
            <div className="flex items-center gap-4 mt-1">
              {unit.leader && (
                <div className="flex items-center gap-1 text-xs text-amber-700">
                  <Crown className="h-3 w-3" />
                  <span>Trưởng: {unit.leader.fullName}</span>
                </div>
              )}
              {unit.deputy && (
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <Star className="h-3 w-3" />
                  <span>Phó: {unit.deputy.fullName}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(unit)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(unit)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && unit.children?.map((child) => (
        <UnitTreeNode key={child.id} unit={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

export default function ToChucPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null)
  const queryClient = useQueryClient()

  const { data: units, isLoading } = useQuery({
    queryKey: ['organization-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization/tree')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  const deleteUnit = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/organization/${id}`)
    },
    onSuccess: () => {
      toast.success('Đã xóa đơn vị')
      queryClient.invalidateQueries({ queryKey: ['organization-units'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(axiosErr.response?.data?.message || axiosErr.message || 'Có lỗi xảy ra')
    },
  })

  const handleEdit = (unit: OrganizationUnit) => {
    setEditingUnit(unit)
    setShowCreateModal(true)
  }

  const handleDelete = (unit: OrganizationUnit) => {
    if (confirm(`Xác nhận xóa "${unit.name}"? Hành động này không thể hoàn tác.`)) {
      deleteUnit.mutate(unit.id)
    }
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setEditingUnit(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổ chức</h1>
          <p className="text-gray-600 mt-1">Cấu trúc tổ chức đơn vị — lớp học và đội</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowCreateTeamModal(true)}
          >
            <Shield className="h-5 w-5" />
            Tạo đội
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-5 w-5" />
            Thêm đơn vị
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : units && units.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {units.map((unit) => (
              <UnitTreeNode key={unit.id} unit={unit} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-600">Chưa có đơn vị tổ chức nào.</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn vị đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateOrgUnitModal
          onClose={handleCloseCreateModal}
          editingUnit={editingUnit ?? undefined}
        />
      )}

      {showCreateTeamModal && (
        <CreateTeamModal onClose={() => setShowCreateTeamModal(false)} />
      )}
    </div>
  )
}
