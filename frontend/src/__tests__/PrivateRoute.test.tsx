import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import PrivateRoute from '@/routes/PrivateRoute'

// Упрощенная форма auth-состояния, которую читает mock useAuth.
type AuthState = {
  token: string | null
  loaded: boolean
  role: 'TRAINER' | 'ATHLETE' | null
}

let authState: AuthState = {
  token: null,
  loaded: true,
  role: null,
}

// Глобально подменяем useAuth, чтобы управлять входными состояниями route guard.
vi.mock('@/context/auth', () => ({
  // Подменяем useAuth, чтобы изолированно тестировать route guard.
  useAuth: () => authState,
}))

describe('PrivateRoute', () => {
  it('redirects to login when token is missing', async () => {
    // Arrange: пользователь не авторизован.
    authState = { token: null, loaded: true, role: null }

    // Act: рендерим роуты с защищенным маршрутом.
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route element={<PrivateRoute />}>
            <Route path="/private" element={<div>private page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Assert: попали на login route.
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('renders child route for allowed role', async () => {
    // Arrange: есть токен и роль TRAINER, разрешенная для маршрута.
    authState = { token: 'jwt', loaded: true, role: 'TRAINER' }

    // Act: рендерим guarded route c allowedRoles.
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/dashboard" element={<div>dashboard</div>} />
          <Route element={<PrivateRoute allowedRoles={['TRAINER']} />}>
            <Route path="/private" element={<div>private page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Assert: контент защищенного роутинга отрисован.
    expect(await screen.findByText('private page')).toBeInTheDocument()
  })

  it('redirects to dashboard when role is forbidden', async () => {
    // Arrange: роль ATHLETE не входит в allowedRoles=[TRAINER].
    authState = { token: 'jwt', loaded: true, role: 'ATHLETE' }

    // Act: рендерим тот же protected route.
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/dashboard" element={<div>dashboard</div>} />
          <Route element={<PrivateRoute allowedRoles={['TRAINER']} />}>
            <Route path="/private" element={<div>private page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Assert: guard редиректит на /dashboard.
    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })
})
