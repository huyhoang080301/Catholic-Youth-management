'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { NotificationItem } from '@/components/notifications/notification-item'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/use-notifications'

export default function ThongBaoPage() {
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0

  const sortedNotifications = notifications?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">Bạn có {unreadCount} thông báo chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            Đánh dấu tất cả là đã đọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : sortedNotifications && sortedNotifications.length > 0 ? (
        <div className="space-y-3">
          {sortedNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <p className="text-center text-gray-600">Không có thông báo nào.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

