'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Member } from '@/types'

interface MemberCardProps {
  member: Member
}

export function MemberCard({ member }: MemberCardProps) {
  return (
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
            {member.organizationUnit && (
              <p className="text-sm text-gray-500">{member.organizationUnit.name}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
