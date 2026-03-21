'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Session, Attendance, AttendanceRecord } from '@/types'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await api.get<Session[]>('/sessions')
      return Array.isArray(data) ? data : (data as any)?.data ?? []
    },
  })
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data } = await api.get<Session>(`/sessions/${sessionId}`)
      return data
    },
    enabled: !!sessionId,
  })
}

export function useSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ['attendance', sessionId],
    queryFn: async () => {
      const { data } = await api.get<Attendance[]>(`/attendance/sessions/${sessionId}`)
      return Array.isArray(data) ? data : (data as any)?.data ?? []
    },
    enabled: !!sessionId,
  })
}

export function useSessionMembers(sessionId: string) {
  return useQuery({
    queryKey: ['session-members', sessionId],
    queryFn: async () => {
      const { data } = await api.get<any[]>(`/sessions/${sessionId}/members`)
      return Array.isArray(data) ? data : (data as any)?.data ?? []
    },
    enabled: !!sessionId,
  })
}

export function useSubmitAttendance() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      records,
    }: {
      sessionId: string
      records: AttendanceRecord[]
    }) => {
      const { data } = await api.post(`/attendance/sessions/${sessionId}`, {
        records,
      })
      return data
    },
  })
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (sessionData: any) => {
      const { data } = await api.post('/sessions', sessionData)
      return data
    },
  })
}

export function useMemberAttendance(memberId: string) {
  return useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      const { data } = await api.get<Attendance[]>(`/attendance/members/${memberId}`)
      return Array.isArray(data) ? data : (data as any)?.data ?? []
    },
    enabled: !!memberId,
  })
}
