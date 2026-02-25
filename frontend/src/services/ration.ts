// src/services/ration.ts
import { api } from './client'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

// --- Типы для сводной таблицы "Рацион" ---

export type RationGroupFilter = 'ALL' | 'JUNIORS' | 'SENIORS'

export interface RationSummaryFilter {
  date: string
  group?: RationGroupFilter
  search?: string
}

export interface RationSummaryRow {
  athleteId: string
  fullName: string
  groupName: string
  foodStatus?: string | null
  weight?: number | null
  notes?: string | null
}

// --- Получение сводки по рациону (общий список спортсменов) ---

export async function getRationSummary(
  params: RationSummaryFilter,
): Promise<RationSummaryRow[]> {
  const searchParams = new URLSearchParams()
  searchParams.set('date', params.date)

  if (params.group && params.group !== 'ALL') {
    searchParams.set('group', params.group)
  }
  if (params.search && params.search.trim()) {
    searchParams.set('search', params.search.trim())
  }

  return api<RationSummaryRow[]>(`${API_URL}/ration/summary?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
}

// --- Сохранение рациона конкретного спортсмена на конкретный день ---

export interface SaveRationRequest {
  athleteId: string
  date: string // YYYY-MM-DD
  foodStatus?: string | null
  weight?: number | null
  notes?: string | null
}

/**
 * PATCH /api/ration/{athleteId}/weight
 * body: { date, foodStatus, morningWeight, comment }
 */
export async function saveRationForDay(req: SaveRationRequest): Promise<void> {
  await api<void>(`${API_URL}/ration/${req.athleteId}/weight`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({
      date: req.date,
      foodStatus: req.foodStatus ?? null,
      morningWeight: req.weight ?? null,
      comment: req.notes ?? null,
    }),
  })
}

// --- Неделя рациона спортсмена (для AthleteProfile.tsx) ---

// грубый тип ответа — если потребуется, детализируем
export interface WeeklyRationDto {
  athlete: any
  weekStart: string
  weekEnd: string
  days: any[]
}

// Перегрузки, чтобы покрыть оба возможных варианта вызова
export async function getWeeklyRation(
  athleteId: string,
  week: string,
): Promise<WeeklyRationDto>
export async function getWeeklyRation(params: {
  athleteId: string
  week: string
}): Promise<WeeklyRationDto>
export async function getWeeklyRation(
  arg1: string | { athleteId: string; week: string },
  arg2?: string,
): Promise<WeeklyRationDto> {
  let athleteId: string
  let week: string

  if (typeof arg1 === 'string') {
    athleteId = arg1
    week = arg2 ?? new Date().toISOString().slice(0, 10)
  } else {
    athleteId = arg1.athleteId
    week = arg1.week
  }

  const searchParams = new URLSearchParams()
  searchParams.set('week', week)

  return api<WeeklyRationDto>(
    `${API_URL}/ration/${athleteId}?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )
}

// --- Локальная пост-обработка сводки (пока заглушка, просто проброс) ---

export function applyLocalToSummary(rows: RationSummaryRow[]): RationSummaryRow[] {
  return rows
}
