'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Session, Attendance, AttendanceRecord, Member } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  total?: number
}

function unwrapArray<T>(raw: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? [])
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await api.get<Session[] | PaginatedResponse<Session>>('/sessions')
      return unwrapArray(data)
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
      const { data } = await api.get<Attendance[] | PaginatedResponse<Attendance>>(
        `/attendance/sessions/${sessionId}`,
      )
      return unwrapArray(data)
    },
    enabled: !!sessionId,
  })
}

export function useSessionMembers(sessionId: string) {
  return useQuery({
    queryKey: ['session-members', sessionId],
    queryFn: async () => {
      const { data } = await api.get<Member[] | PaginatedResponse<Member>>(
        `/sessions/${sessionId}/members`,
      )
      return unwrapArray(data)
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
      const { data } = await api.post<Attendance[]>(`/attendance/sessions/${sessionId}`, {
        records,
      })
      return data
    },
  })
}

interface CreateSessionPayload {
  title: string
  date: string
  organizationUnitId?: number
  description?: string
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (sessionData: CreateSessionPayload) => {
      const { data } = await api.post<Session>('/sessions', sessionData)
      return data
    },
  })
}

export function useMemberAttendance(memberId: string) {
  return useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      const { data } = await api.get<Attendance[] | PaginatedResponse<Attendance>>(
        `/attendance/members/${memberId}`,
      )
      return unwrapArray(data)
    },
    enabled: !!memberId,
  })
}

