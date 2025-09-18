
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Athletes from '@/routes/Athletes'
import { worker } from '@/mocks/browser'

describe('Athletes page', () => {
  beforeAll(async () => { await worker.start() })
  afterAll(async () => { await worker.stop() })

  it('allows adding an athlete', async () => {
    const qc = new QueryClient()
    render(<QueryClientProvider client={qc}><Athletes/></QueryClientProvider>)
    // Wait for list
    expect(await screen.findByText('Список спортсменов')).toBeInTheDocument()
    const btn = screen.getByText(/Добавить спортсмена/)
    fireEvent.click(btn)
    const fio = await screen.findByLabelText('ФИО', { selector: 'input' })
    fireEvent.change(fio, { target: { value: 'Тест Тестов' } })
    const dob = screen.getByLabelText('Дата рождения', { selector: 'input' })
    fireEvent.change(dob, { target: { value: '2000-01-01' } })
    const group = screen.getByLabelText('Группа', { selector: 'select' })
    fireEvent.change(group, { target: { value: 'Юниоры' } })
    fireEvent.click(screen.getByText('Сохранить'))
    await waitFor(()=> expect(screen.getByText('Успешно сохранено')).toBeInTheDocument())
  })
})
