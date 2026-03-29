import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard } from './skeleton'

describe('Skeleton', () => {
  it('should render with animate-pulse class', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeTruthy()
    expect(el).toHaveClass('animate-pulse')
  })

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-20 rounded-full" />)
    expect(container.firstChild).toHaveClass('h-10')
    expect(container.firstChild).toHaveClass('w-20')
  })

  it('should be aria-hidden', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('SkeletonCard', () => {
  it('should render skeleton card with multiple placeholder lines', () => {
    const { container } = render(<SkeletonCard />)
    // SkeletonCard renders a div with class "rounded-lg border border-gray-200 bg-white p-4 space-y-3"
    expect(container.firstChild).toHaveClass('rounded-lg')
    expect(container.firstChild).toHaveClass('border-gray-200')
    expect(container.firstChild).toHaveClass('bg-white')
    // animate-pulse is on inner Skeleton children, not the root card
    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy()
  })

  it('should render 5 skeleton elements inside the card', () => {
    const { container } = render(<SkeletonCard />)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBe(5) // 2 header + 2 lines = 5 total
  })
})
