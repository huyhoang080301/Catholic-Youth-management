'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface AddressForm {
  street: string
  ward: string
  district: string
  province: string
}

interface ParentForm {
  fullName: string
  phone: string
  address: AddressForm
}

interface SacramentForm {
  baptismDate: string
  baptismPlace: string
  firstConfessionDate: string
  firstConfessionPlace: string
  firstCommunionDate: string
  firstCommunionPlace: string
  confirmationDate: string
  confirmationPlace: string
}

interface CreateMemberForm {
  fullName: string
  baptismName: string
  dateOfBirth: string
  gender: string
  phone: string
  address: AddressForm
  parentInfo: ParentForm
  sacraments: SacramentForm
}

const emptyAddress = (): AddressForm => ({ street: '', ward: '', district: '', province: '' })
const emptyParent = (): ParentForm => ({ fullName: '', phone: '', address: emptyAddress() })
const emptySacraments = (): SacramentForm => ({
  baptismDate: '', baptismPlace: '',
  firstConfessionDate: '', firstConfessionPlace: '',
  firstCommunionDate: '', firstCommunionPlace: '',
  confirmationDate: '', confirmationPlace: '',
})

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

interface CreateMemberModalProps {
  onClose: () => void
}

export function CreateMemberModal({ onClose }: CreateMemberModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateMemberForm>({
    fullName: '',
    baptismName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: emptyAddress(),
    parentInfo: emptyParent(),
    sacraments: emptySacraments(),
  })
  const [error, setError] = useState('')

  const set = (field: keyof CreateMemberForm, value: any) =>
    setForm((f) => ({ ...f, [field]: value }))

  const setAddr = (field: keyof AddressForm, value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }))

  const setParent = (field: keyof ParentForm, value: string) =>
    setForm((f) => ({ ...f, parentInfo: { ...f.parentInfo, [field]: value } }))

  const setParentAddr = (field: keyof AddressForm, value: string) =>
    setForm((f) => ({
      ...f,
      parentInfo: { ...f.parentInfo, address: { ...f.parentInfo.address, [field]: value } },
    }))

  const setSacr = (field: keyof SacramentForm, value: string) =>
    setForm((f) => ({ ...f, sacraments: { ...f.sacraments, [field]: value } }))

  const createMember = useMutation({
    mutationFn: async (data: CreateMemberForm) => {
      const hasAddress = Object.values(data.address).some((v) => v.trim())
      const hasParent = data.parentInfo.fullName.trim()
      const hasSacraments = Object.values(data.sacraments).some((v) => v.trim())

      const payload: any = {
        fullName: data.fullName.trim(),
      }
      if (data.baptismName.trim()) payload.baptismName = data.baptismName.trim()
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth
      if (data.gender) payload.gender = data.gender
      if (data.phone.trim()) payload.phone = data.phone.trim()
      if (hasAddress) payload.address = data.address
      if (hasParent) payload.parentInfo = { ...data.parentInfo }
      if (hasSacraments) {
        const s = data.sacraments
        if (s.baptismDate) { payload.baptismDate = s.baptismDate; payload.baptismPlace = s.baptismPlace }
        if (s.firstConfessionDate) { payload.firstConfessionDate = s.firstConfessionDate; payload.firstConfessionPlace = s.firstConfessionPlace }
        if (s.firstCommunionDate) { payload.firstCommunionDate = s.firstCommunionDate; payload.firstCommunionPlace = s.firstCommunionPlace }
        if (s.confirmationDate) { payload.confirmationDate = s.confirmationDate; payload.confirmationPlace = s.confirmationPlace }
      }

      const { data: res } = await api.post('/members', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) {
      setError('Họ tên là bắt buộc')
      return
    }
    createMember.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Thêm thành viên mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Thông tin cá nhân — mở sẵn */}
          <Section title="Thông tin cá nhân" defaultOpen>
            <Field label="Họ và tên *">
              <input type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                placeholder="Nguyễn Văn A" className={inputCls} />
            </Field>
            <Field label="Tên thánh">
              <input type="text" value={form.baptismName} onChange={(e) => set('baptismName', e.target.value)}
                placeholder="Maria, Giuse, ..." className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày sinh">
                <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Giới tính">
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </Field>
            </div>
            <Field label="Số điện thoại">
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="0901234567" className={inputCls} />
            </Field>
          </Section>

          {/* Địa chỉ */}
          <Section title="Địa chỉ">
            <Field label="Số nhà / Đường">
              <input type="text" value={form.address.street} onChange={(e) => setAddr('street', e.target.value)}
                placeholder="123 Đường ABC" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phường / Xã">
                <input type="text" value={form.address.ward} onChange={(e) => setAddr('ward', e.target.value)}
                  placeholder="Phường 1" className={inputCls} />
              </Field>
              <Field label="Quận / Huyện">
                <input type="text" value={form.address.district} onChange={(e) => setAddr('district', e.target.value)}
                  placeholder="Quận 1" className={inputCls} />
              </Field>
            </div>
            <Field label="Tỉnh / Thành phố">
              <input type="text" value={form.address.province} onChange={(e) => setAddr('province', e.target.value)}
                placeholder="Hồ Chí Minh" className={inputCls} />
            </Field>
          </Section>

          {/* Thông tin phụ huynh */}
          <Section title="Thông tin phụ huynh">
            <Field label="Họ tên phụ huynh">
              <input type="text" value={form.parentInfo.fullName} onChange={(e) => setParent('fullName', e.target.value)}
                placeholder="Nguyễn Văn B" className={inputCls} />
            </Field>
            <Field label="Số điện thoại phụ huynh">
              <input type="tel" value={form.parentInfo.phone} onChange={(e) => setParent('phone', e.target.value)}
                placeholder="0901234567" className={inputCls} />
            </Field>
            <Field label="Địa chỉ phụ huynh (nếu khác)">
              <input type="text" value={form.parentInfo.address.street} onChange={(e) => setParentAddr('street', e.target.value)}
                placeholder="123 Đường ABC" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phường / Xã">
                <input type="text" value={form.parentInfo.address.ward} onChange={(e) => setParentAddr('ward', e.target.value)}
                  placeholder="Phường 1" className={inputCls} />
              </Field>
              <Field label="Quận / Huyện">
                <input type="text" value={form.parentInfo.address.district} onChange={(e) => setParentAddr('district', e.target.value)}
                  placeholder="Quận 1" className={inputCls} />
              </Field>
            </div>
            <Field label="Tỉnh / Thành phố">
              <input type="text" value={form.parentInfo.address.province} onChange={(e) => setParentAddr('province', e.target.value)}
                placeholder="Hồ Chí Minh" className={inputCls} />
            </Field>
          </Section>

          {/* Các mốc bí tích */}
          <Section title="Các mốc bí tích">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày Rửa Tội">
                <input type="date" value={form.sacraments.baptismDate} onChange={(e) => setSacr('baptismDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nơi Rửa Tội">
                <input type="text" value={form.sacraments.baptismPlace} onChange={(e) => setSacr('baptismPlace', e.target.value)}
                  placeholder="Giáo xứ ..." className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày Xưng Tội lần đầu">
                <input type="date" value={form.sacraments.firstConfessionDate} onChange={(e) => setSacr('firstConfessionDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nơi Xưng Tội">
                <input type="text" value={form.sacraments.firstConfessionPlace} onChange={(e) => setSacr('firstConfessionPlace', e.target.value)}
                  placeholder="Giáo xứ ..." className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày Rước Lễ lần đầu">
                <input type="date" value={form.sacraments.firstCommunionDate} onChange={(e) => setSacr('firstCommunionDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nơi Rước Lễ">
                <input type="text" value={form.sacraments.firstCommunionPlace} onChange={(e) => setSacr('firstCommunionPlace', e.target.value)}
                  placeholder="Giáo xứ ..." className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày Thêm Sức">
                <input type="date" value={form.sacraments.confirmationDate} onChange={(e) => setSacr('confirmationDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nơi Thêm Sức">
                <input type="text" value={form.sacraments.confirmationPlace} onChange={(e) => setSacr('confirmationPlace', e.target.value)}
                  placeholder="Giáo xứ ..." className={inputCls} />
              </Field>
            </div>
          </Section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="flex-1"
              isLoading={createMember.isPending} disabled={createMember.isPending}>
              Thêm thành viên
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
