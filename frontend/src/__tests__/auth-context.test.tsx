import React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/auth'

// Тестовый компонент-проба для чтения значений из AuthContext.
function Probe() {
  const { token, refreshToken, username, role, userId, loaded, login, logout } = useAuth()
  // Кнопки ниже вызывают login/logout из контекста для проверки записи и очистки сессии.

  return (
    <div>
      <div data-testid="loaded">{String(loaded)}</div>
      <div data-testid="token">{token ?? 'null'}</div>
      <div data-testid="refresh">{refreshToken ?? 'null'}</div>
      <div data-testid="username">{username ?? 'null'}</div>
      <div data-testid="role">{role ?? 'null'}</div>
      <div data-testid="userId">{userId ?? 'null'}</div>
      <button
        onClick={() => login('access-1', 'refresh-1', 'coach', 'TRAINER', 'u1')}
      >
        do-login
      </button>
      <button onClick={logout}>do-logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  it('restores session from localStorage', async () => {
    // Arrange: заранее кладем авторизационные значения в localStorage.
    localStorage.setItem('auth_token', 'access-local')
    localStorage.setItem('auth_refresh_token', 'refresh-local')
    localStorage.setItem('auth_username', 'stored-user')
    localStorage.setItem('auth_role', 'ATHLETE')
    localStorage.setItem('auth_user_id', 'user-42')

    // Act: монтируем AuthProvider и читаем состояние через Probe.
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    // Assert: provider восстановил все поля сессии.
    await waitFor(() => expect(screen.getByTestId('loaded').textContent).toBe('true'))
    expect(screen.getByTestId('token').textContent).toBe('access-local')
    expect(screen.getByTestId('refresh').textContent).toBe('refresh-local')
    expect(screen.getByTestId('username').textContent).toBe('stored-user')
    expect(screen.getByTestId('role').textContent).toBe('ATHLETE')
    expect(screen.getByTestId('userId').textContent).toBe('user-42')
  })

  it('writes and clears auth state through login/logout', async () => {
    // Arrange: стартуем с пустым localStorage.
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    // Act: логинимся через контекстную функцию login().
    fireEvent.click(screen.getByText('do-login'))

    // Assert: login записал токены и метаданные пользователя.
    expect(localStorage.getItem('auth_token')).toBe('access-1')
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-1')
    expect(localStorage.getItem('auth_username')).toBe('coach')
    expect(localStorage.getItem('auth_role')).toBe('TRAINER')
    expect(localStorage.getItem('auth_user_id')).toBe('u1')

    // Act: выполняем logout через context.
    fireEvent.click(screen.getByText('do-logout'))

    // Assert: logout полностью очищает auth-хранилище.
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_refresh_token')).toBeNull()
    expect(localStorage.getItem('auth_username')).toBeNull()
    expect(localStorage.getItem('auth_role')).toBeNull()
    expect(localStorage.getItem('auth_user_id')).toBeNull()
  })
})
