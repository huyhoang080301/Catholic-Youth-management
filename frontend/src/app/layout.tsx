import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'

export const metadata: Metadata = {
  title: 'TNTT - Quản lý Đoàn viên',
  description: 'Hệ thống quản lý Đoàn viên Maria Trinh Vương',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-50">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
