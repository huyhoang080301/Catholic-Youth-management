'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { OrganizationUnit } from '@/types'

type TransitionAction =
  | 'transfer-class'
  | 'transfer-branch'
  | 'promote'
  | 'set-inactive'
  | 'set-on_leave'
  | 'set-reserved'
  | 'set-active'

const ACTION_LABELS: Record<TransitionAction, string> = {
  'transfer-class': 'Chuyển lớp',
  'transfer-branch': 'Chuyển đổi (chi đoàn)',
  'promote': 'Lên lớp',
  'set-inactive': 'Nghỉ học',
  'set-on_leave': 'Tạm nghỉ',
  'set-reserved': 'Bảo lưu',
  'set-active': 'Kích hoạt lại',
}

interface Props {
  memberId: number
  memberName: string
  onClose: () => void
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

export function MemberTransitionModal({ memberId, memberName, onClose }: Props) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<TransitionAction>('transfer-class')
  const [toUnitId, setToUnitId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: units } = useQuery({
    queryKey: ['organization-units'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationUnit[]>('/organization')
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      setError('')
      setSuccess('')

      if (action === 'transfer-class') {
        if (!toUnitId) throw new Error('Vui lòng chọn lớp đích')
        await api.patch(`/members/${memberId}/transfer-class`, {
          toOrganizationUnitId: Number(toUnitId),
          reason: reason || undefined,
        })
      } else if (action === 'transfer-branch') {
        if (!toUnitId) throw new Error('Vui lòng chọn chi đoàn đích')
        await api.patch(`/members/${memberId}/transfer-branch`, {
          toOrganizationUnitId: Number(toUnitId),
          reason: reason || undefined,
        })
      } else if (action === 'promote') {
        await api.patch(`/members/${memberId}/promote`, {
          reason: reason || undefined,
        })
      } else {
        // set-status actions
        const statusMap: Record<string, string> = {
          'set-inactive': 'inactive',
          'set-on_leave': 'on_leave',
          'set-reserved': 'reserved',
          'set-active': 'active',
        }
        await api.patch(`/members/${memberId}/set-status`, {
          toStatus: statusMap[action],
          reason: reason || undefined,
        })
      }
    },
    onSuccess: () => {
      toast.success(`${ACTION_LABELS[action]} thành công!`)
      setSuccess(`${ACTION_LABELS[action]} thành công`)
      queryClient.invalidateQueries({ queryKey: ['member', String(memberId)] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setTimeout(onClose, 1200)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      setError(msg)
    },
  })

  const needsUnit = action === 'transfer-class' || action === 'transfer-branch'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Thay đổi trạng thái</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Thành viên: <span className="font-semibold text-gray-800">{memberName}</span>
          </p>

          {/* Action selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Chọn hành động</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ACTION_LABELS) as TransitionAction[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAction(a); setError(''); setSuccess('') }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                    action === a
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {ACTION_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Unit selector for transfer actions */}
          {needsUnit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {action === 'transfer-class' ? 'Lớp đích' : 'Chi đoàn đích'}
              </label>
              <select
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                className={inputCls}
              >
                <option value="">-- Chọn đơn vị --</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lý do (tùy chọn)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do..."
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {ACTION_LABELS[action]}
          </Button>
        </div>
      </div>
    </div>
  )
}


