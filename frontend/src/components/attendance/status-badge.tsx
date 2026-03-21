'use client'

import { Badge } from '@/components/ui/badge'
import { AttendanceStatus } from '@/types'

interface StatusBadgeProps {
  status: AttendanceStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    [AttendanceStatus.PRESENT]: { variant: 'success' as const, label: 'Có mặt' },
    [AttendanceStatus.ABSENT]: { variant: 'error' as const, label: 'Vắng mặt' },
    [AttendanceStatus.EXCUSED]: { variant: 'warning' as const, label: 'Nghỉ phép' },
  }

  const config = variants[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
