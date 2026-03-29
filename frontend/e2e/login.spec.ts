import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page with correct elements', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'TNTT' })).toBeVisible()
    await expect(page.getByLabel('Tên đăng nhập')).toBeVisible()
    await expect(page.getByLabel('Mật khẩu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
  })

  test('should show validation error when fields are empty', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    // Browser native validation should prevent submission
    await expect(page.getByLabel('Tên đăng nhập')).toBeFocused()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Tên đăng nhập').fill('wronguser')
    await page.getByLabel('Mật khẩu').fill('wrongpassword')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page.getByText('Đăng nhập thất bại')).toBeVisible({ timeout: 5000 })
  })

  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
