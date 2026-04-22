import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Этот setup автоматически подключается перед каждым тестовым файлом.

// Единая очистка между тестами исключает утечки состояния.
afterEach(() => {
  // Чистим DOM между тестами Testing Library.
  cleanup()
  // Сбрасываем localStorage, чтобы тесты не влияли друг на друга.
  localStorage.clear()
})
