'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { saveToken, clearTokens } from '@/lib/auth'
import { AuthResponse } from '@/types'

export function useAuth() {
  const router = useRouter()

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      saveToken(data.accessToken, data.refreshToken)
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
      router.push('/auth/login')
    }
  }, [router])

  return { login, logout }
}
