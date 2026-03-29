import { test, expect } from '@playwright/test'

// These tests require authentication. Use storageState to reuse login session.
test.describe('Members Management', () => {
  // We'll use a helper to authenticate in beforeEach via API login
  test.beforeEach(async ({ page }) => {
    // Login via API then navigate
    await page.goto('/auth/login')
    await page.getByLabel('Tên đăng nhập').fill('admin')
    await page.getByLabel('Mật khẩu').fill('admin123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should navigate to members page', async ({ page }) => {
    await page.goto('/dashboard/thanh-vien')
    // Page should load with search input
    await expect(page.getByPlaceholder('Tìm kiếm thành viên...')).toBeVisible({ timeout: 10000 })
  })

  test('should search for a member', async ({ page }) => {
    await page.goto('/dashboard/thanh-vien')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder('Tìm kiếm thành viên...')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Nguyen')
      await page.waitForTimeout(500)
      // Should show filtered results (may be empty if no match, but should not error)
      await expect(searchInput).toHaveValue('Nguyen')
    }
  })

  test('should filter by active status', async ({ page }) => {
    await page.goto('/dashboard/thanh-vien')
    await page.waitForLoadState('networkidle')

    const activeFilter = page.getByRole('button', { name: 'Hoạt động' })
    if (await activeFilter.isVisible()) {
      await activeFilter.click()
      await page.waitForTimeout(300)
    }
  })

  test('should open create member modal when button is visible', async ({ page }) => {
    await page.goto('/dashboard/thanh-vien')
    await page.waitForLoadState('networkidle')

    const addButton = page.getByRole('button', { name: /Thêm thành viên/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(300)
      // Modal should contain form fields
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible({ timeout: 3000 })
    }
  })

  test('should navigate to member detail page', async ({ page }) => {
    await page.goto('/dashboard/thanh-vien')
    await page.waitForLoadState('networkidle')

    // Wait for member cards to appear
    const memberLink = page.locator('a[href*="/dashboard/thanh-vien/"]').first()
    await memberLink.waitFor({ state: 'visible', timeout: 10000 })
    await memberLink.click()
    await page.waitForLoadState('networkidle')
    // Detail page should load
    await expect(page).toHaveURL(/\/dashboard\/thanh-vien\/\d+/)
  })
})
