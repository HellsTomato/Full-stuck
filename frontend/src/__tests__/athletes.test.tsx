
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Athletes from '@/routes/Athletes'
import { ToastProvider } from '@/components/Toast'
import { linkAthlete } from '@/services/trainerAthletes'

// Мокаем API списка спортсменов для изолированного UI-теста.
vi.mock('@/services/athletes', () => ({
  // Возвращаем стабильный набор данных, чтобы тест не зависел от API.
  getAthletes: vi.fn(async () => ({
    items: [
      {
        id: 'a1',
        fullName: 'Иван Иванов',
        birthDate: '2000-01-01',
        group: 'JUNIORS',
        phone: '+70000000000',
        notes: 'Тест',
      },
    ],
    total: 1,
    page: 0,
    size: 10,
    totalPages: 1,
  })),
}))

// Мокаем API привязки/отвязки спортсменов к тренеру.
vi.mock('@/services/trainerAthletes', () => ({
  getMyAthleteIds: vi.fn(async () => new Set<string>()),
  linkAthlete: vi.fn(async () => undefined),
  unlinkAthlete: vi.fn(async () => undefined),
}))

describe('Athletes page', () => {
  it('loads athlete rows and links athlete to trainer', async () => {
    // Arrange: отдельный QueryClient для каждого теста.
    const qc = new QueryClient()

    // Act: рендерим страницу в минимальном окружении роутера и toast.
    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/athletes']}>
            <Athletes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )

    // Assert: строка спортсмена загрузилась.
    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()

    // Act: пользователь выбирает спортсмена.
    fireEvent.click(screen.getByText('Выбрать'))

    // Assert: вызван API linkAthlete с id нужного спортсмена.
    await waitFor(() => {
      expect(linkAthlete).toHaveBeenCalled()
      expect((linkAthlete as any).mock.calls[0][0]).toBe('a1')
    })
  })
})
