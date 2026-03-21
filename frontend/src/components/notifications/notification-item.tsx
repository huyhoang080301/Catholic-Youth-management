'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { Notification } from '@/types'
import { X } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const variants = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
  } as const

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : 'bg-white'
      }`}
      onClick={() => !notification.isRead && onMarkRead?.(notification.id)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant={variants[notification.type]}>
                {notification.type}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDateTime(notification.createdAt)}
              </span>
            </div>
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
