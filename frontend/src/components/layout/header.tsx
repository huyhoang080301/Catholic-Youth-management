'use client'

import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-blue-600">TNTT</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700"
          title="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
