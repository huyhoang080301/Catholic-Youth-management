import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { OrganizationUnit, Branch, TeamType } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  total?: number
}

function unwrapArray<T>(raw: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? [])
}

export function useOrganizationTree() {
  return useQuery({
    queryKey: ['organization-tree'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[]>('/organization/tree')
      return data
    },
  })
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | PaginatedResponse<OrganizationUnit>>('/organization')
      return unwrapArray(data)
    },
  })
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit>(`/organization/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[] | PaginatedResponse<OrganizationUnit>>('/organization')
      const all = unwrapArray<OrganizationUnit>(data)
      return all.filter((u) => u.type === 'doi')
    },
  })
}

export function useOrganizationMembers(unitId: number) {
  return useQuery({
    queryKey: ['organization-members', unitId],
    queryFn: async () => {
      const { data } = await api.get(`/organization/${unitId}/members`)
      return data
    },
    enabled: !!unitId,
  })
}

export function useJoinByCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.get<OrganizationUnit>(`/organization/join/${code}`)
      return data
    },
  })
}

interface CreateTeamPayload {
  name: string
  branch?: Branch
  teamType: TeamType
  leaderId?: number
  deputyId?: number
  memberIds?: number[]
  description?: string
  code?: string
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTeamPayload) => {
      const { data } = await api.post<OrganizationUnit>('/organization', {
        ...payload,
        type: 'doi',
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam(teamId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<CreateTeamPayload>) => {
      const { data } = await api.patch<OrganizationUnit>(`/organization/${teamId}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['organization', teamId] })
    },
  })
}

export function useOrganizationStats() {
  return useQuery({
    queryKey: ['organization-stats'],
    queryFn: async () => {
      const { data } = await api.get('/organization/stats')
      return data
    },
  })
}
