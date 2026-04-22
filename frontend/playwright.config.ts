import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Папка со сквозными тестами.
  testDir: './e2e',
  // Глобальный timeout на один тест.
  timeout: 30_000,
  expect: {
    // Timeout для expect/assert в тестах.
    timeout: 5_000,
  },
  use: {
    // Отдельный порт для изоляции от других dev-серверов.
    baseURL: 'http://127.0.0.1:4173',
    // Трейс пишем при ретрае для удобной диагностики падений.
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Основной браузерный профиль для e2e.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Перед e2e поднимаем фронтенд в dev-режиме.
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    cwd: '.',
    url: 'http://127.0.0.1:4173',
    // Не переиспользуем чужой сервер, чтобы исключить ложные прогоны.
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
