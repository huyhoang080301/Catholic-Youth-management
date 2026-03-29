'use client'

import { ReactNode } from 'react'
import { useAuthContext } from '@/providers/auth-provider'
import { hasRole } from '@/types'

interface RoleGateProps {
  children: ReactNode
  roles: string[]
  /** Render fallback UI instead of hiding children */
  fallback?: ReactNode
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
  const { user } = useAuthContext()
  if (!hasRole(user, ...roles)) return <>{fallback}</>
  return <>{children}</>
}
