// src/services/athletes.ts
import type { Athlete } from '@/types'

const base = '' // при прокси в vite.config.ts оставь пустым

export async function getAthletes(params: { search?: string; group?: string; status?: string } = {}) {
  const qs = new URLSearchParams(params as any).toString()
  const res = await fetch(`${base}/api/athletes${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Ошибка загрузки спортсменов')
  const json = await res.json()
  // 💡 Бэк может вернуть массив или объект с items — нормализуем:
  const items: Athlete[] = Array.isArray(json) ? json : (json?.items ?? [])
  return { items }
}

export async function createAthlete(body: Partial<Athlete>) {
  const res = await fetch(`${base}/api/athletes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка: не удалось сохранить')
  return res.json()
}

export async function updateAthlete(id: string, body: Partial<Athlete>) {
  const res = await fetch(`${base}/api/athletes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка: не удалось сохранить')
  return res.json()
}
