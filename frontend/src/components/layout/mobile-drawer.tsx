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
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadNotificationCount } from '@/hooks/use-notifications'
import { useAuthContext } from '@/providers/auth-provider'
import { ROLE_LABELS, hasRole } from '@/types'

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/dashboard/diem-danh', label: 'Điểm danh', icon: CheckSquare },
  { href: '/dashboard/thanh-vien', label: 'Thành viên', icon: Users, roles: ['admin', 'chu_nhiem', 'truong_ban'] },
  { href: '/dashboard/to-chuc', label: 'Tổ chức', icon: Building2, roles: ['admin', 'chu_nhiem', 'truong_ban'] },
  { href: '/dashboard/quan-ly-user', label: 'Quản lý tài khoản', icon: UserCog, roles: ['admin', 'chu_nhiem'] },
  { href: '/dashboard/thong-bao', label: 'Thông báo', icon: Bell },
]

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { user } = useAuthContext()
  const unreadCount = useUnreadNotificationCount()

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || hasRole(user, ...item.roles),
  )

  const userRoleLabel = user?.roles?.[0]
    ? ROLE_LABELS[user.roles[0]] ?? user.roles[0]
    : null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-72 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">TNTT</h1>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* User info */}
        {userRoleLabel && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              {userRoleLabel}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors min-h-[48px]',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
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

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => { logout(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors min-h-[48px]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}
