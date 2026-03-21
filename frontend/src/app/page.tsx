'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasToken } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (hasToken()) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  )
}
