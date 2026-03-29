import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from 'react-hot-toast'

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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              style: { background: '#16a34a', color: '#fff' },
            },
            error: {
              style: { background: '#dc2626', color: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
