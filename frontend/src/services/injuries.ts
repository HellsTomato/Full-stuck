// frontend/src/services/injuries.ts

// Импортируем общий тип травмы и enum статуса
import type { Injury, InjuryStatus } from '@/styles/types'

/**
 * Параметры фильтрации списка травм.
 * Используются на экране "Состояние здоровья".
 */
export type InjuriesFilter = {
  // 'ALL' = не фильтровать по статусу
  status?: 'ALL' | InjuryStatus
  // код группы (если фильтруем по группе)
  group?: string
  // строка поиска по ФИО
  search?: string
}

/**
 * Функция для загрузки списка травм с сервера.
 * GET /api/injuries?status=...&group=...&search=...
 */
export async function fetchInjuries(
  params: InjuriesFilter = {}
): Promise<Injury[]> {
  const qs = new URLSearchParams()

  if (params.status && params.status !== 'ALL') {
    qs.set('status', params.status)
  }

  if (params.group && params.group !== 'ALL') {
    qs.set('group', params.group)
  }

  if (params.search) {
    qs.set('search', params.search)
  }

  const res = await fetch(`/api/injuries?${qs.toString()}`)

  if (!res.ok) {
    throw new Error('Ошибка загрузки травм')
  }

  return (await res.json()) as Injury[]
}

/**
 * Параметры для старой функции getInjuries,
 * которую уже использует экран профиля спортсмена.
 */
export type GetInjuriesParams = InjuriesFilter & {
  athleteId?: string
}

/**
 * Совместимость со старым кодом.
 * По сути — обёртка над fetchInjuries с доп. фильтром по athleteId.
 */
export async function getInjuries(
  params: GetInjuriesParams = {}
): Promise<Injury[]> {
  const list = await fetchInjuries(params)

  if (params.athleteId) {
    return list.filter((inj) => inj.athleteId === params.athleteId)
  }

  return list
}

/**
 * Создание травмы
 * POST /api/injuries
 */
export type CreateInjuryPayload = {
  athleteId: string
  type: string
  date: string
  notes?: string
}

export async function createInjury(
  payload: CreateInjuryPayload
): Promise<Injury> {
  const res = await fetch('/api/injuries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ошибка создания травмы (${res.status}): ${text}`)
  }

  return (await res.json()) as Injury
}

/**
 * Детали одной травмы
 * GET /api/injuries/{id}
 */
export async function fetchInjury(id: number): Promise<Injury> {
  const res = await fetch(`/api/injuries/${id}`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Ошибка загрузки травмы (${res.status})${text ? `: ${text}` : ''}`
    )
  }

  return (await res.json()) as Injury
}

/**
 * Удаление травмы
 * DELETE /api/injuries/{id}
 */
export async function deleteInjury(id: number): Promise<void> {
  const res = await fetch(`/api/injuries/${id}`, {
    method: 'DELETE',
  })

  // 204 / 404 считаем нормальными вариантами
  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ошибка удаления (${res.status}): ${text}`)
  }
}

/**
 * Изменение статуса травмы (активная / закрытая)
 * PATCH /api/injuries/{id}/status
 */
export type UpdateInjuryStatusPayload = {
  status: InjuryStatus
  closedDate?: string | null
}

export async function updateInjuryStatus(
  id: number,
  payload: UpdateInjuryStatusPayload
): Promise<Injury> {
  const res = await fetch(`/api/injuries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ошибка изменения статуса (${res.status}): ${text}`)
  }

  return (await res.json()) as Injury
}
