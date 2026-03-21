'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  Bell,
  LogOut,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadNotificationCount } from '@/hooks/use-notifications'

const navItems = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/dashboard/diem-danh', label: 'Điểm danh', icon: CheckSquare },
  { href: '/dashboard/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/dashboard/to-chuc', label: 'Tổ chức', icon: Building2 },
  { href: '/dashboard/quan-ly-user', label: 'Quản lý tài khoản', icon: UserCog },
  { href: '/dashboard/thong-bao', label: 'Thông báo', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const unreadCount = useUnreadNotificationCount()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-lg font-bold text-blue-600">TNTT</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/thong-bao' && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 space-y-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
