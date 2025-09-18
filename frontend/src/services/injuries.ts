// src/services/injuries.ts
import type { Injury } from '@/types'

const base = '' // при прокси в vite.config.ts оставляем пустым

type GetParams = { status?: string }

export async function getInjuries(params: GetParams = {}) {
  const qs = new URLSearchParams(params as any).toString()
  const res = await fetch(`${base}/api/injuries${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Ошибка загрузки травм')
  const json = await res.json()
  // нормализуем ответ: бэк может вернуть массив или { items }
  const items: Injury[] = Array.isArray(json) ? json : (json?.items ?? [])
  return { items }
}

export async function createInjury(body: Partial<Injury>) {
  const res = await fetch(`${base}/api/injuries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка: не удалось сохранить')
  return res.json()
}

export async function updateInjury(id: string, body: Partial<Injury>) {
  const res = await fetch(`${base}/api/injuries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка: не удалось сохранить')
  return res.json()
}
