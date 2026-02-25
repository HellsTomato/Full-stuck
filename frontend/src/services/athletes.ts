// src/services/athletes.ts
import type { Athlete } from "@/types"
import { api } from "./client"

const base = "" // при Vite proxy оставляем пустым

// ====================================================================
// 1. Получение списка спортсменов
// GET /api/athletes?search=&group=
// ====================================================================
export async function getAthletes(params: { search?: string; group?: string } = {}) {
  const qs = new URLSearchParams()

  if (params.search) qs.set("search", params.search)
  if (params.group) qs.set("group", params.group)

  const url = `${base}/api/athletes${qs.toString() ? "?" + qs.toString() : ""}`

  const json = await api<any>(url)

  // backend отдаёт список как List<Athlete>
  const items: Athlete[] = Array.isArray(json) ? json : (json.items ?? [])

  // нормализуем имя группы
  return {
    items: items.map((a) => ({
      ...a,
      group: a.group || a.grp, // важно
    })),
  }
}

export async function getMyAthlete() {
  const athlete = await api<Athlete>(`${base}/api/athletes/me`)
  return {
    ...athlete,
    group: (athlete as any).group || (athlete as any).grp,
  } as Athlete
}

// ====================================================================
// 2. Обновление спортсмена
// PATCH /api/athletes/{id}
// ====================================================================
export async function updateAthlete(id: string, body: Partial<Athlete>) {
  const mapped = {
    fullName: body.fullName,
    birthDate: body.birthDate,
    grp: body.group,
    phone: body.phone,
    notes: body.notes,
  }

  return api<Athlete>(`${base}/api/athletes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mapped),
  })
}

export async function updateMyAthlete(body: Partial<Athlete>) {
  const mapped = {
    fullName: body.fullName,
    birthDate: body.birthDate,
    grp: body.group,
    phone: body.phone,
    notes: body.notes,
  }

  const athlete = await api<Athlete>(`${base}/api/athletes/me`, {
    method: "PATCH",
    body: JSON.stringify(mapped),
  })

  return {
    ...athlete,
    group: (athlete as any).group || (athlete as any).grp,
  } as Athlete
}

export async function uploadMyAthletePhoto(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const token = localStorage.getItem("auth_token")

  const response = await fetch(`${base}/api/athletes/me/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Не удалось загрузить фото")
  }

  const athlete = (await response.json()) as Athlete
  return {
    ...athlete,
    group: (athlete as any).group || (athlete as any).grp,
  } as Athlete
}
