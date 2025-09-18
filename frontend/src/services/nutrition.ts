
import { api } from './client'
import type { Nutrition } from '@/types'

export async function getNutrition(params: { athleteId?: string; from?: string; to?: string }){
  const q = new URLSearchParams(params as any).toString()
  return api<{ items: Nutrition[] }>(`/api/nutrition${q ? `?${q}`: ''}`)
}
