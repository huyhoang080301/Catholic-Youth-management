'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface ImportResult {
  created: number
  failed: number
  errors: string[]
}

interface ExcelImportButtonProps {
  uploadUrl: string
  onSuccess?: (result: ImportResult) => void
  label?: string
}

export function ExcelImportButton({ uploadUrl, onSuccess, label = 'Import Excel' }: ExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + uploadUrl,
        {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          body: formData,
        }
      )

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || ('HTTP ' + res.status))
      }

      const importResult: ImportResult = await res.json()
      setResult(importResult)
      onSuccess?.(importResult)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setResult({ created: 0, failed: -1, errors: [message] })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="inline-block">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        isLoading={loading}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {label}
      </Button>

      {result && (
        <div className={result.failed > 0 ? 'mt-3 p-3 rounded-lg text-sm bg-yellow-50 border border-yellow-200' : 'mt-3 p-3 rounded-lg text-sm bg-green-50 border border-green-200'}>
          <p className="font-medium">
            Tạo thành công: <span className="text-green-700">{result.created}</span>
            {result.failed > 0 && (
              <span> &mdash; Lỗi: <span className="text-red-600">{result.failed}</span></span>
            )}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-red-600">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i}>- {e}</li>
              ))}
              {result.errors.length > 5 && (
                <li className="text-gray-500">...và {result.errors.length - 5} lỗi khác</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

