// src/services/attendance.ts
import type { Attendance } from '@/types'

type GetParams = {
  date: string
  group?: string
}

// GET /api/attendance?date=&group=
export async function getAttendance(params: GetParams) {
  const qs = new URLSearchParams(params as any).toString()
  const res = await fetch(`/api/attendance?${qs}`)
  if (!res.ok) throw new Error('Ошибка загрузки посещаемости')
  const json = await res.json()
  // нормализуем: бэк/моки могут вернуть {items} или массив
  const items: Attendance[] = Array.isArray(json) ? json : (json?.items ?? [])
  return { items }
}

type BulkItem = {
  athleteId: string
  sessionId: string
  status: Attendance['status'] // "Присутствовал" | "Опоздал" | "Отсутствовал"
}

type BulkPayload = {
  date: string
  group?: string
  items: BulkItem[]
}

// POST /api/attendance/bulk
export async function postAttendanceBulk(payload: BulkPayload) {
  const res = await fetch(`/api/attendance/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ошибка сохранения (${res.status}): ${text}`)
  }
  return res.json() // ожидаем { items: Attendance[] }
}
