'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/types'
import { getToken, clearTokens } from '@/lib/auth'
import api from '@/lib/api'

// Extended user type that includes roles (from /auth/me)
type AuthUser = User & { roles?: string[] }

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  logout: () => void
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = () => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    api.get<AuthUser>('/auth/me')
      .then(({ data }) => {
        setUser(data)
        localStorage.setItem('tntt_user', JSON.stringify(data))
      })
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    // Read cached user from localStorage first (instant, no flicker)
    const cached = localStorage.getItem('tntt_user')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
        setIsLoading(false)
      } catch {
        // ignore
      }
    }
    // Then refresh from server
    fetchMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => {
    clearTokens()
    localStorage.removeItem('tntt_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
