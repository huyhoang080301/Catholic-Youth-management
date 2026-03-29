'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Notification } from '@/types'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Notification[]; total: number }>('/notifications')
      return data.data ?? []
    },
    // Only load once when component mounts — no polling
  })
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications()
  return Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: number) => {
      await api.patch(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Không thể đánh dấu đã đọc')
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/mark-all-read')
    },
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả là đã đọc')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Không thể đánh dấu đã đọc')
    },
  })
}


