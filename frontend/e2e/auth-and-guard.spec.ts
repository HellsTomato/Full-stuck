import { test, expect } from '@playwright/test'

test('redirects anonymous user from protected route to /login', async ({ page }) => {
  // Arrange: очищаем auth-состояние до старта приложения.
  await page.addInitScript(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_username')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_user_id')
  })

  // Act: открываем защищенный маршрут.
  await page.goto('/dashboard')

  // Assert: гость редиректится на логин-страницу.
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible()
})

test('restores session from localStorage and keeps user inside app', async ({ page }) => {
  // Arrange: имитируем ранее сохраненную сессию пользователя.
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'access-token')
    localStorage.setItem('auth_refresh_token', 'refresh-token')
    localStorage.setItem('auth_username', 'trainer1')
    localStorage.setItem('auth_role', 'TRAINER')
    localStorage.setItem('auth_user_id', 'u-1')
  })

  // Мокаем API, чтобы экран не падал из-за недоступного backend.
  await page.route('**/api/trainers/profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: 'trainer1',
        fullName: 'Тренер Тестовый',
        photoUrl: null,
      }),
    })
  })

  // Act: открываем защищенный маршрут как авторизованный пользователь.
  await page.goto('/dashboard')

  // Assert: пользователь остается в приложении без редиректа на логин.
  await expect(page).toHaveURL(/\/dashboard$/)
})
