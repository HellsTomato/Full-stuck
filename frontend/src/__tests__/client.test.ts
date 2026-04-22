import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, apiFetch } from '@/services/client'

describe('api client', () => {
  beforeEach(() => {
    // Полный сброс состояния перед каждым тест-кейсом.
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('refreshes token and retries request once on 401', async () => {
    // Arrange: в localStorage лежит старая access/refresh пара.
    localStorage.setItem('auth_token', 'old-access')
    localStorage.setItem('auth_refresh_token', 'old-refresh')

    // Arrange: формируем цепочку ответов fetch (401 -> refresh 200 -> retry 200).
    const fetchMock = vi.fn()
    fetchMock
      // Первый запрос в защищенный endpoint падает 401.
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // Затем refresh успешен.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            username: 'trainer',
            role: 'TRAINER',
            userId: 'u1',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      // Повтор исходного запроса после refresh.
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

    vi.stubGlobal('fetch', fetchMock)

  // Act: запускаем запрос через общий API-клиент.
    const response = await apiFetch('/api/secure', { method: 'GET' })

  // Assert: клиент сделал retry и сохранил новые токены.
    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('auth_token')).toBe('new-access')
    expect(localStorage.getItem('auth_refresh_token')).toBe('new-refresh')

    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access')
  })

  it('throws forbidden error for 403 responses', async () => {
    // Arrange: backend отвечает 403.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })))

    // Assert: api(...) преобразует 403 в понятную бизнес-ошибку.
    await expect(api('/api/secure', { method: 'GET' })).rejects.toThrow(
      'Недостаточно прав для выполнения действия.'
    )
  })

  it('clears auth on unrecoverable 401', async () => {
    // Arrange: в хранилище есть авторизационные данные.
    localStorage.setItem('auth_token', 'access')
    localStorage.setItem('auth_refresh_token', 'refresh')

    // Для теста отключаем редирект, чтобы не зависеть от реализации jsdom location.
    window.history.pushState({}, '', '/login')

    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))

    vi.stubGlobal('fetch', fetchMock)

    // Act: делаем запрос, который не удается восстановить даже через refresh.
    const response = await apiFetch('/api/secure', { method: 'GET' })

    // Assert: токены очищаются, ответ остается 401.
    expect(response.status).toBe(401)
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_refresh_token')).toBeNull()
  })
})
