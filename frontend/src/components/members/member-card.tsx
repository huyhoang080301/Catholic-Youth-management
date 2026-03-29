'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Member } from '@/types'

interface MemberCardProps {
  member: Member
  onEdit?: (member: Member) => void
  onDelete?: (member: Member) => void
}

const BRANCH_LABELS: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    if (onEdit) {
      e.preventDefault()
      e.stopPropagation()
      onEdit(member)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault()
      e.stopPropagation()
      onDelete(member)
    }
  }

  return (
    <div className="relative">
      <Link href={`/dashboard/thanh-vien/${member.id}`}>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{member.fullName}</h3>
                  {member.baptismName && (
                    <p className="text-xs text-gray-600 mt-1">Thánh danh: {member.baptismName}</p>
                  )}
                </div>
                <Badge variant={member.isActive ? 'success' : 'default'}>
                  {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>

              {member.phone && (
                <p className="text-sm text-gray-600">{member.phone}</p>
              )}

              {/* Lớp */}
              {member.organizationUnit && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="default" className="text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    Lớp
                  </Badge>
                  <span className="text-sm text-gray-700">{member.organizationUnit.name}</span>
                </div>
              )}

              {/* Đội */}
              {member.teams && member.teams.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="default" className="text-xs bg-orange-50 text-orange-700 border border-orange-100">
                    Đội
                  </Badge>
                  <span className="text-sm text-gray-700">
                    {member.teams.map((mt, i) => (
                      <span key={mt.id}>
                        {mt.team?.name ?? ''}
                        {mt.team?.branch && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({BRANCH_LABELS[mt.team.branch] ?? mt.team.branch})
                          </span>
                        )}
                        {i < member.teams!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
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
            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-colors shadow-sm"
            title="Sửa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-red-600 transition-colors shadow-sm"
            title="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
