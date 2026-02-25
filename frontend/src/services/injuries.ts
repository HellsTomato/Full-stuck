// frontend/src/services/injuries.ts

// Импортируем общий тип травмы и enum статуса
import type { Injury, InjuryStatus } from '@/styles/types'
import { api } from './client'

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

  return api<Injury[]>(`/api/injuries?${qs.toString()}`)
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
  return api<Injury>('/api/injuries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Детали одной травмы
 * GET /api/injuries/{id}
 */
export async function fetchInjury(id: number): Promise<Injury> {
  return api<Injury>(`/api/injuries/${id}`)
}

/**
 * Удаление травмы
 * DELETE /api/injuries/{id}
 */
export async function deleteInjury(id: number): Promise<void> {
  await api<void>(`/api/injuries/${id}`, {
    method: 'DELETE',
  })
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
  return api<Injury>(`/api/injuries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
