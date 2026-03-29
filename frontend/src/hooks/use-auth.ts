'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { saveToken, clearTokens } from '@/lib/auth'
import { AuthResponse } from '@/types'

export function useAuth() {
  const router = useRouter()

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        username,
        password,
      })
      saveToken(data.accessToken, data.refreshToken)

      // Fetch /auth/me immediately to get roles, then redirect
      const { data: meData } = await api.get<AuthResponse['user'] & { roles?: string[] }>('/auth/me')
      // Store roles in localStorage so AuthProvider picks them up
      localStorage.setItem('tntt_user', JSON.stringify(meData))

      router.push('/dashboard')
    },
    [router]
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Continue logout even if API call fails
    } finally {
      clearTokens()
      localStorage.removeItem('tntt_user')
      router.push('/auth/login')
    }
  }, [router])

  return { login, logout }
}
