// frontend/src/services/attendance.ts

// Тип Attendance описан в '@/types'
import type { Attendance } from '@/types'

// Параметры для загрузки посещаемости с бэкенда
export type AttendanceGetParams = {
  date: string // дата в формате 'YYYY-MM-DD'
  group?: string // 'JUNIORS' | 'SENIORS' | undefined (нет параметра)
}

// Тип одного элемента батч-обновления
export type AttendanceBulkItem = {
  athleteId: number // ID спортсмена
  status: Attendance['status'] // статус берём из типа Attendance
}

// Тело запроса для массового обновления
export type AttendanceBulkPayload = {
  date: string // дата, для которой сохраняем статусы
  group?: string // выбранная группа (может быть undefined)
  items: AttendanceBulkItem[] // массив спортсменов со статусами
}

// Ответ бэка: либо массив, либо объект { items: [...] }
type AttendanceListResponse = {
  items: Attendance[]
} | Attendance[]

// ─────────────────────────────────────────────
// Нормализация статуса, чтобы фронт всегда жил
// в одном формате: "PRESENT" | "LATE" | "ABSENT"
// ─────────────────────────────────────────────
function normalizeStatus(input: string): Attendance['status'] {
  switch (input) {
    case 'PRESENT':
    case 'LATE':
    case 'ABSENT':
      // уже правильный enum -> возвращаем как есть
      return input as Attendance['status']

    // На всякий случай, если бэк/старый фронт когда-то вернёт русские
    case 'Присутствовал':
      return 'PRESENT'
    case 'Опоздал':
      return 'LATE'
    case 'Отсутствовал':
      return 'ABSENT'

    // дефолт: считаем как отсутсвовал
    default:
      return 'ABSENT'
  }
}

// ─────────────────────────────────────────────
// Нормализация ответа к виду "массив Attendance"
// + принудительная нормализация статуса
// ─────────────────────────────────────────────
function normalizeResponse(json: AttendanceListResponse): Attendance[] {
  const list = Array.isArray(json) ? json : json?.items ?? []
  return list.map((item) => ({
    ...item,
    status: normalizeStatus((item as any).status),
  }))
}

// ─────────────────────────────────────────────
// GET /api/attendance?date=YYYY-MM-DD&group=JUNIORS
// Загрузка посещаемости за конкретную дату и группу
// ─────────────────────────────────────────────
export async function getAttendance(
  params: AttendanceGetParams
): Promise<Attendance[]> {
  const search = new URLSearchParams()

  // дата обязательна
  search.set('date', params.date)

  // group добавляем только если он явно задан
  if (params.group && params.group.trim() !== '') {
    search.set('group', params.group)
  }

  const res = await fetch(`/api/attendance?${search.toString()}`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Ошибка загрузки посещаемости (${res.status}): ${text || 'Unknown error'}`
    )
  }

  const json = (await res.json()) as AttendanceListResponse
  return normalizeResponse(json)
}

// ─────────────────────────────────────────────
// POST /api/attendance/bulk
// Массовое сохранение статусов посещаемости
// ─────────────────────────────────────────────
export async function postAttendanceBulk(
  payload: AttendanceBulkPayload
): Promise<Attendance[]> {
  const res = await fetch(`/api/attendance/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ошибка сохранения (${res.status}): ${text}`)
  }

  const json = (await res.json()) as AttendanceListResponse
  return normalizeResponse(json)
}
