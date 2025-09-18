
import { api } from './client'
import type { SessionItem } from '@/types'

export async function getWeeklyPlan(params: { weekStart: string; group?: string }){
  const q = new URLSearchParams(params as any).toString()
  return api<{ items: SessionItem[] }>(`/api/weekly-plan?${q}`)
}
export async function copyWeek(body: { fromWeek: string; toWeek: string; group?: string; overwrite?: boolean }){
  return api<{ items: SessionItem[] }>(`/api/weekly-plan/copy`, { method: 'POST', body: JSON.stringify(body) })
}
