import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Tên đăng nhập').fill('admin')
    await page.getByLabel('Mật khẩu').fill('admin123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Dashboard should have a stats section
    await expect(page.getByText('Tổng số thành viên')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to organization page', async ({ page }) => {
    await page.goto('/dashboard/to-chuc')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Tổ chức/i })).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to sessions page', async ({ page }) => {
    await page.goto('/dashboard/sinh-hoat')
    await page.waitForLoadState('networkidle')
    // Should show session list or empty state
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to notifications page', async ({ page }) => {
    await page.goto('/dashboard/thong-bao')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Thông báo/i })).toBeVisible({ timeout: 10000 })
  })
})
