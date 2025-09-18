
import { api } from './client'

export async function createReport(body: { type: "nutrition"|"attendance"|"weight", params: any }){
  return api<{ url: string }>(`/api/reports`, { method: 'POST', body: JSON.stringify(body) })
}
