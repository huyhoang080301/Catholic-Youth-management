import { describe, it, expect } from '@jest/globals'
import { cn, formatDate, formatDateTime, toDateString, isToday } from './utils'

describe('cn (classname merger)', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle undefined', () => {
    const result = cn('text-red-500', undefined, 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should deduplicate with tailwind-merge', () => {
    const result = cn('text-red-500 text-blue-500')
    expect(result).toBe('text-blue-500')
  })
})

describe('formatDate', () => {
  it('should format date string', () => {
    const result = formatDate('2026-03-15')
    expect(result).toContain('2026')
    expect(result).toContain('15')
    expect(result).toContain('tháng')
  })

  it('should format Date object', () => {
    const result = formatDate(new Date('2026-03-15'))
    expect(result).toContain('2026')
    expect(result).toContain('tháng')
  })
})

describe('formatDateTime', () => {
  it('should format date and time', () => {
    const result = formatDateTime('2026-03-15T08:30:00')
    expect(result).toContain('15')
    expect(result).toContain('2026')
    expect(result).toContain('08')
    expect(result).toContain('30')
  })
})

describe('toDateString', () => {
  it('should return ISO date string', () => {
    expect(toDateString(new Date('2026-03-15T08:30:00'))).toBe('2026-03-15')
    expect(toDateString('2026-03-15')).toBe('2026-03-15')
  })
})

describe('isToday', () => {
  it('should return true for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isToday(today)).toBe(true)
  })

  it('should return false for a different date', () => {
    expect(isToday('2020-01-01')).toBe(false)
  })
})
