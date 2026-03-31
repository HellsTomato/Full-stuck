// src/services/athletes.ts
import type { Athlete } from "@/types"
import { api, apiFetch } from "./client"

const base = "" // при Vite proxy оставляем пустым

type AthleteListParams = {
  // ЛР3: серверные параметры фильтрации/сортировки/пагинации.
  search?: string
  group?: string
  sortBy?: "fullName" | "birthDate" | "group"
  sortDir?: "asc" | "desc"
  page?: number
  size?: number
}

// ====================================================================
// 1. Получение списка спортсменов
// GET /api/athletes?search=&group=
// ====================================================================
export async function getAthletes(params: AthleteListParams = {}) {
  const qs = new URLSearchParams()

  if (params.search) qs.set("search", params.search)
  if (params.group) qs.set("group", params.group)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  if (typeof params.page === "number") qs.set("page", String(params.page))
  if (typeof params.size === "number") qs.set("size", String(params.size))

  const url = `${base}/api/athletes${qs.toString() ? "?" + qs.toString() : ""}`

  const json = await api<any>(url)

  // backend может вернуть List<Athlete> или пагинированный объект
  const items: Athlete[] = Array.isArray(json) ? json : (json.items ?? [])

  const normalizedItems = items.map((a) => ({
    ...a,
    group: a.group || a.grp,
  }))

  return {
    // Мета поля нужны экрану для управления страницами.
    items: normalizedItems,
    total: Array.isArray(json) ? normalizedItems.length : (json.total ?? normalizedItems.length),
    page: Array.isArray(json) ? 0 : (json.page ?? 0),
    size: Array.isArray(json) ? normalizedItems.length : (json.size ?? normalizedItems.length),
    totalPages: Array.isArray(json) ? 1 : (json.totalPages ?? 1),
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

  const response = await apiFetch(`${base}/api/athletes/me/photo`, {
    method: "POST",
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

export async function deleteMyAthletePhoto() {
  // ЛР3: endpoint удаляет и файл, и ссылку photoUrl в записи атлета.
  const athlete = await api<Athlete>(`${base}/api/athletes/me/photo`, {
    method: "DELETE",
  })
  return {
    ...athlete,
    group: (athlete as any).group || (athlete as any).grp,
  } as Athlete
}
