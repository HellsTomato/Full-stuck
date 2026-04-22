import { test, expect } from '@playwright/test'

test('redirects to /login when refresh token is expired', async ({ page }) => {
  // Счетчик нужен, чтобы подтвердить факт попытки refresh.
  let refreshCalls = 0

  // Arrange: имитируем устаревшую сессию в localStorage.
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'expired-access')
    localStorage.setItem('auth_refresh_token', 'expired-refresh')
    localStorage.setItem('auth_username', 'trainer1')
    localStorage.setItem('auth_role', 'TRAINER')
    localStorage.setItem('auth_user_id', 'u-1')
  })

  await page.route('**/api/auth/refresh', async (route) => {
    // Первый и последующие refresh-запросы принудительно отклоняем.
    refreshCalls += 1
    await route.fulfill({ status: 401, body: '' })
  })

  // Любой защищенный API отвечает 401, что запускает retry+logout flow.
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/refresh')) {
      await route.fallback()
      return
    }
    await route.fulfill({ status: 401, body: '' })
  })

  await page.goto('/athletes')

  // Assert: пользователь должен вернуться на login после провала refresh.
  await expect(page).toHaveURL(/\/login$/)
  // Assert: refresh flow действительно был запущен.
  expect(refreshCalls).toBeGreaterThan(0)
})
