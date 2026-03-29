'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OrganizationUnit } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

const BRANCH_LABELS: Record<string, string> = {
  chien_con: 'Chiên Con',
  au_nhi: 'Ấu Nhi',
  thieu_nhi: 'Thiếu Nhi',
  nghia_si: 'Nghĩa Sĩ',
  hiep_si: 'Hiệp Sĩ',
}

type Step = 'lookup' | 'form' | 'success'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('lookup')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState<OrganizationUnit | null>(null)
  const [loadingUnit, setLoadingUnit] = useState(false)
  const [unitError, setUnitError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    gender: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingUnit(true)
    setUnitError('')
    setUnit(null)

    try {
      const res = await fetch(`${API_URL}/organization/join/${encodeURIComponent(code.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Không tìm thấy đơn vị' }))
        setUnitError(err.message || 'Không tìm thấy đơn vị với mã này')
        return
      }
      const data = await res.json()
      setUnit(data)
      setStep('form')
    } catch {
      setUnitError('Không thể kết nối. Vui lòng thử lại.')
    } finally {
      setLoadingUnit(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch(`${API_URL}/pending-registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationUnitCode: code.trim(), ...form }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Gửi đăng ký thất bại' }))
        throw new Error(err.message || 'Gửi đăng ký thất bại')
      }
      setStep('success')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-600">TNTT</h1>
          <p className="text-sm text-gray-600">
            {step === 'success'
              ? 'Đăng ký thành công!'
              : 'Đăng ký tham gia Đoàn TNTT'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Lookup by code */}
          {step === 'lookup' && (
            <form onSubmit={handleLookup} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Nhập <strong>mã đoàn/lớp</strong> được cung cấp bởi Trưởng ban để đăng ký tham gia.
              </p>

              {unitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{unitError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Mã đơn vị
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="VD: LOP3A, THIEU_NHI_01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={loadingUnit}
                  required
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={loadingUnit}
                disabled={loadingUnit || !code.trim()}
              >
                Tìm đơn vị
              </Button>

              <p className="text-center text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Registration form */}
          {step === 'form' && unit && (
            <>
              {/* Unit info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold mb-1">
                  Đơn vị được chọn:
                </p>
                <p className="text-gray-900 font-bold text-lg">{unit.name}</p>
                {unit.branch && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {BRANCH_LABELS[unit.branch] || unit.branch}
                  </span>
                )}
                {unit.leader && (
                  <p className="text-sm text-gray-600 mt-2">
                    Trưởng ban: <strong>{unit.leader.fullName}</strong>
                  </p>
                )}
                <button
                  onClick={() => { setStep('lookup'); setUnit(null) }}
                  className="text-xs text-blue-600 hover:underline mt-2 block"
                >
                  ← Chọn đơn vị khác
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-semibold text-gray-900">Thông tin đăng ký</h3>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                      Ngày sinh
                    </label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Giới tính
                    </label>
                    <select
                      id="gender"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      disabled={submitting}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-50"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Số điện thoại phụ huynh
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0xxx xxx xxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="note" className="text-sm font-medium text-gray-700">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id="note"
                    rows={2}
                    placeholder="Thông tin thêm về em (lớp, trường, dị ứng, v.v.)"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    disabled={submitting}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={submitting}
                  disabled={submitting || !form.fullName.trim()}
                >
                  Gửi đăng ký
                </Button>

                <p className="text-center text-xs text-gray-500">
                  Đơn đăng ký sẽ được Trưởng ban duyệt trước khi tạo tài khoản.
                </p>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Đăng ký đã được gửi!</p>
                <p className="text-sm text-gray-600 mt-2">
                  Trưởng ban sẽ xem xét và liên hệ với bạn sớm nhất.<br />
                  Vui lòng giữ điện thoại để nhận thông tin.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <button
                  onClick={() => { setStep('lookup'); setUnit(null); setCode(''); setForm({ fullName: '', dateOfBirth: '', phone: '', gender: '', note: '' }) }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Đăng ký thêm thành viên khác
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
