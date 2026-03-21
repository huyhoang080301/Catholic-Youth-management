'use client'

import Cookies from 'js-cookie'

const TOKEN_KEY = 'tntt_token'
const REFRESH_TOKEN_KEY = 'tntt_refresh_token'

export function saveToken(token: string, refreshToken?: string): void {
  Cookies.set(TOKEN_KEY, token, { expires: 7 })
  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 30 })
  }
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY)
}

export function clearTokens(): void {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
}

export function hasToken(): boolean {
  return !!getToken()
}
