'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AttendanceStatus } from '@/types'

interface Member {
  id: number | string
  fullName: string
  baptismName?: string
}

interface AttendanceListProps {
  members: Member[]
  onAttendanceChange: (memberId: string, status: AttendanceStatus) => void
  currentStatus: Record<string, AttendanceStatus>
}

export function AttendanceList({
  members,
  onAttendanceChange,
  currentStatus,
}: AttendanceListProps) {
  const statuses = [
    { key: AttendanceStatus.PRESENT, label: 'Có mặt' },
    { key: AttendanceStatus.ABSENT, label: 'Vắng mặt' },
    { key: AttendanceStatus.EXCUSED, label: 'Nghỉ phép' },
  ]

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const memberId = String(member.id)
        const status = currentStatus[memberId]

        return (
          <Card key={memberId} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{member.fullName}</h3>
                  {member.baptismName && (
                    <p className="text-xs text-gray-500 truncate">{member.baptismName}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {statuses.map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={status === key ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onAttendanceChange(memberId, key)}
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
