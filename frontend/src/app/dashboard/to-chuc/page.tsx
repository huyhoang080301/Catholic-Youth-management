'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { OrganizationUnit } from '@/types'
import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { CreateOrgUnitModal } from '@/components/common/create-org-unit-modal'

function UnitTreeNode({ unit, level = 0 }: { unit: OrganizationUnit; level?: number }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = unit.children && unit.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 py-3 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        style={{ paddingLeft: `${level * 20 + 16}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronRight className="h-4 w-4 text-gray-400" />
        ) : (
          <div className="h-4 w-4" />
        )}
        <span className="font-medium text-gray-900">{unit.name}</span>
        {unit.type && (
          <span className="ml-2 text-xs text-gray-400 capitalize">{unit.type.replace('_', ' ')}</span>
        )}
        {unit.branch && (
          <span className="ml-1 text-xs text-blue-500 capitalize">{unit.branch.replace('_', ' ')}</span>
        )}
      </div>
      {hasChildren && expanded && unit.children?.map((child) => (
        <UnitTreeNode key={child.id} unit={child} level={level + 1} />
      ))}
    </div>
  )
}

export default function ToChucPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: units, isLoading } = useQuery({
    queryKey: ['organization-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | { data: OrganizationUnit[] }>('/organization/tree')
      return Array.isArray(data) ? data : (data as { data: OrganizationUnit[] }).data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổ chức</h1>
          <p className="text-gray-600 mt-1">Cấu trúc tổ chức đơn vị</p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-5 w-5" />
          Thêm đơn vị
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : units && units.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {units.map((unit) => (
              <UnitTreeNode key={unit.id} unit={unit} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <div className="text-center space-y-4">
              <p className="text-gray-600">Chưa có đơn vị tổ chức nào</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn vị đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateOrgUnitModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}


