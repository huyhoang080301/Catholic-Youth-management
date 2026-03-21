'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadNotificationCount } from '@/hooks/use-notifications'

const navItems = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/dashboard/diem-danh', label: 'Điểm danh', icon: CheckSquare },
  { href: '/dashboard/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/dashboard/to-chuc', label: 'Tổ chức', icon: Building2 },
  { href: '/dashboard/thong-bao', label: 'Thông báo', icon: Bell },
]

export function MobileNav() {
  const pathname = usePathname()
  const unreadCount = useUnreadNotificationCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around h-20 bg-white border-t border-gray-200">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1 h-full relative',
              isActive
                ? 'text-blue-600'
                : 'text-gray-500'
            )}
          >
            <Icon className="h-6 w-6" />
            {item.href === '/dashboard/thong-bao' && unreadCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
            <span className="text-xs">{item.label.split(' ')[0]}</span>
          </Link>
        )
      })}
    </nav>
  )
}




